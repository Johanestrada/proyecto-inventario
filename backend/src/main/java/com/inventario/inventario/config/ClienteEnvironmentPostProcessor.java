package com.inventario.inventario.config;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;

public class ClienteEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        boolean clienteActive = false;
        String[] active = environment.getActiveProfiles();
        for (String p : active) {
            if ("cliente".equalsIgnoreCase(p)) {
                clienteActive = true;
                break;
            }
        }

        if (!clienteActive) {
            String raw = environment.getProperty("spring.profiles.active");
            if (raw != null && raw.contains("cliente")) {
                clienteActive = true;
            }
        }

        if (!clienteActive) {
            return;
        }

        String localApp = System.getenv("LOCALAPPDATA");
        if (localApp == null || localApp.isBlank()) {
            localApp = System.getProperty("user.home") + File.separator + "AppData" + File.separator + "Local";
        }
        File dbDir = new File(localApp, "Inventario" + File.separator + "data");
        if (!dbDir.exists()) {
            boolean ok = dbDir.mkdirs();
            if (!ok) {
                System.err.println("[cliente] Could not create data directory: " + dbDir.getAbsolutePath());
                return;
            } else {
                System.out.println("[cliente] Created data directory: " + dbDir.getAbsolutePath());
            }
        } else {
            System.out.println("[cliente] Data directory exists: " + dbDir.getAbsolutePath());
        }

        // Ensure SQLite file and schema exist before Spring creates DataSource
        String dbPath = new File(dbDir, "inventario.db").getAbsolutePath();
        String jdbcUrl = "jdbc:sqlite:" + dbPath;

        // Force Spring properties so JPA uses the SQLite file and skips Hibernate DDL
        try {
            environment.getSystemProperties().put("spring.datasource.url", jdbcUrl);
            environment.getSystemProperties().put("spring.datasource.driver-class-name", "org.sqlite.JDBC");
            environment.getSystemProperties().put("spring.jpa.hibernate.ddl-auto", "none");
            // Also set as system properties to cover both lookup methods
            System.setProperty("spring.datasource.url", jdbcUrl);
            System.setProperty("spring.datasource.driver-class-name", "org.sqlite.JDBC");
            System.setProperty("spring.jpa.hibernate.ddl-auto", "none");
            System.out.println("[cliente] Forced spring.datasource.url=" + jdbcUrl);
        } catch (Exception e) {
            System.err.println("[cliente] Could not set forced Spring properties: " + e.getMessage());
        }
        try (Connection conn = DriverManager.getConnection(jdbcUrl)) {
            try (Statement stmt = conn.createStatement()) {
                // Improve concurrency behavior on SQLite: enable WAL and set a busy timeout
                try {
                    stmt.execute("PRAGMA journal_mode = WAL;");
                } catch (Exception ignore) {
                }
                try {
                    stmt.execute("PRAGMA busy_timeout = 5000;");
                } catch (Exception ignore) {
                }

                stmt.execute("PRAGMA foreign_keys = ON;");

                // Create tables if missing
                stmt.executeUpdate("CREATE TABLE IF NOT EXISTS producto (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, precio REAL, stock INTEGER);");
                stmt.executeUpdate("CREATE TABLE IF NOT EXISTS venta (id INTEGER PRIMARY KEY AUTOINCREMENT, fecha DATETIME, total REAL);");
                stmt.executeUpdate("CREATE TABLE IF NOT EXISTS detalle_venta (id INTEGER PRIMARY KEY AUTOINCREMENT, cantidad INTEGER, precio_unitario REAL, subtotal REAL, producto_id INTEGER, venta_id INTEGER, FOREIGN KEY(producto_id) REFERENCES producto(id), FOREIGN KEY(venta_id) REFERENCES venta(id));");

                // Ensure 'version' column exists for optimistic locking compatibility
                boolean hasVersion = false;
                try (ResultSet rs = stmt.executeQuery("PRAGMA table_info('producto');")) {
                    while (rs.next()) {
                        String col = rs.getString("name");
                        if ("version".equalsIgnoreCase(col)) {
                            hasVersion = true;
                            break;
                        }
                    }
                }

                if (!hasVersion) {
                    try {
                        stmt.executeUpdate("ALTER TABLE producto ADD COLUMN version INTEGER DEFAULT 0;");
                        System.out.println("[cliente] Added 'version' column to producto table for optimistic locking compatibility.");
                    } catch (SQLException ex) {
                        System.err.println("[cliente] Could not add 'version' column: " + ex.getMessage());
                    }
                }
            }
            System.out.println("[cliente] SQLite DB initialized at: " + dbPath);
        } catch (SQLException e) {
            System.err.println("[cliente] Could not initialize SQLite DB: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
