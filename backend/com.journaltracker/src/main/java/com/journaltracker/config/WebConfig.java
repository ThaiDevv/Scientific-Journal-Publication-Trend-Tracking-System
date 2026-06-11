package com.journaltracker.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Danh sách origins được phép, đọc từ biến môi trường CORS_ALLOWED_ORIGINS.
     * Ví dụ giá trị trên Railway:
     *   CORS_ALLOWED_ORIGINS=https://journal-tracker.vercel.app,http://localhost:5173
     *
     * Không dùng wildcard "*" khi allowCredentials = true vì browser sẽ chặn.
     */
    @Value("${cors.allowed-origins}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}