package com.inventario.inventario.repository;

import java.sql.Connection;
import java.util.Map;
import java.util.Optional;

import javax.sql.DataSource;

import org.springframework.stereotype.Repository;

import com.inventario.inventario.model.Producto;

import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;

@Repository
public class ProductoRepositoryImpl implements ProductoRepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    private final DataSource dataSource;
    private volatile Boolean sqliteCached;

    public ProductoRepositoryImpl(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    private boolean detectSQLite() {
        // Try to detect from Hibernate/JPA properties first
        Map<String, Object> props = em.getEntityManagerFactory().getProperties();
        Object urlProp = props.get("hibernate.connection.url");
        if (urlProp == null) urlProp = props.get("jakarta.persistence.jdbc.url");
        if (urlProp == null) urlProp = props.get("javax.persistence.jdbc.url");
        if (urlProp instanceof String) {
            String u = ((String) urlProp).toLowerCase();
            if (u.contains("sqlite")) return true;
        }

        // Fallback to JDBC metadata (performed once)
        try (Connection c = dataSource.getConnection()) {
            String product = c.getMetaData().getDatabaseProductName();
            String metaUrl = c.getMetaData().getURL();
            if ((product != null && product.toLowerCase().contains("sqlite")) ||
                    (metaUrl != null && metaUrl.toLowerCase().contains("sqlite"))) {
                return true;
            }
        } catch (Exception ignored) {
        }

        return false;
    }

    private boolean isSQLite() {
        Boolean cached = sqliteCached;
        if (cached != null) return cached;
        synchronized (this) {
            if (sqliteCached != null) return sqliteCached;
            sqliteCached = detectSQLite();
            return sqliteCached;
        }
    }

    @Override
    public Optional<Producto> findByIdForUpdate(Long id) {
        if (isSQLite()) {
            Producto p = em.find(Producto.class, id);
            return Optional.ofNullable(p);
        }

        Producto p = em.find(Producto.class, id, LockModeType.PESSIMISTIC_WRITE);
        return Optional.ofNullable(p);
    }
}
