package com.inventario.inventario.config;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    @GetMapping(value = {"/", "/productos", "/ventas", "/historial"}, produces = MediaType.TEXT_HTML_VALUE)
    public String servirAplicacionReact() {
        return "forward:/index.html";
    }
}
