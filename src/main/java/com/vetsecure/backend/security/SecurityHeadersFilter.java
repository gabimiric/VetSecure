package com.vetsecure.backend.security;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpServletResponseWrapper;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Security headers filter that applies to ALL HTTP responses.
 * This ensures OWASP compliance by adding security headers even for
 * static resources, error pages, and CORS preflight requests.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeadersFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // Wrap the response to ensure headers are applied on sendError/sendRedirect
        SecurityHeadersResponseWrapper wrappedResponse = new SecurityHeadersResponseWrapper(httpResponse);

        // Continue with the filter chain
        chain.doFilter(request, wrappedResponse);

        // Apply headers AFTER chain completes to ensure they're on all responses (only once)
        applySecurityHeaders(httpResponse);
    }

    /**
     * Apply all security headers to the HTTP response.
     */
    private void applySecurityHeaders(HttpServletResponse httpResponse) {
        // Content Security Policy (CSP) - prevents XSS and injection attacks
        httpResponse.setHeader("Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "img-src 'self' data: https:; " +
                "font-src 'self' data:; " +
                "connect-src 'self' http://localhost:3000 http://localhost:8080 http://127.0.0.1:3000; " +
                "frame-src 'none'; " +
                "object-src 'none'; " +
                "base-uri 'self'; " +
                "form-action 'self'; " +
                "frame-ancestors 'none'"
        );

        // X-Frame-Options - clickjacking protection
        httpResponse.setHeader("X-Frame-Options", "DENY");

        // X-Content-Type-Options - MIME sniffing protection
        httpResponse.setHeader("X-Content-Type-Options", "nosniff");

        // X-XSS-Protection - legacy XSS filter for older browsers
        httpResponse.setHeader("X-XSS-Protection", "1; mode=block");

        // Referrer-Policy - control referrer information
        httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Permissions-Policy (formerly Feature-Policy) - control browser features
        httpResponse.setHeader("Permissions-Policy",
                "geolocation=(), microphone=(), camera=(), payment=()"
        );

        // Remove server information headers
        httpResponse.setHeader("Server", "");
        httpResponse.setHeader("X-Powered-By", "");
    }

    /**
     * Response wrapper that ensures security headers are applied even when
     * the response is committed early (like in error scenarios).
     */
    private static class SecurityHeadersResponseWrapper extends HttpServletResponseWrapper {

        public SecurityHeadersResponseWrapper(HttpServletResponse response) {
            super(response);
        }

        @Override
        public void sendError(int sc) throws IOException {
            applyHeadersToWrapped();
            super.sendError(sc);
        }

        @Override
        public void sendError(int sc, String msg) throws IOException {
            applyHeadersToWrapped();
            super.sendError(sc, msg);
        }

        @Override
        public void sendRedirect(String location) throws IOException {
            applyHeadersToWrapped();
            super.sendRedirect(location);
        }

        private void applyHeadersToWrapped() {
            HttpServletResponse response = (HttpServletResponse) getResponse();
            if (!response.containsHeader("Content-Security-Policy")) {
                response.setHeader("Content-Security-Policy",
                        "default-src 'self'; " +
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "img-src 'self' data: https:; " +
                        "font-src 'self' data:; " +
                        "connect-src 'self' http://localhost:3000 http://localhost:8080 http://127.0.0.1:3000; " +
                        "frame-src 'none'; " +
                        "object-src 'none'; " +
                        "base-uri 'self'; " +
                        "form-action 'self'; " +
                        "frame-ancestors 'none'"
                );
            }
            if (!response.containsHeader("X-Frame-Options")) {
                response.setHeader("X-Frame-Options", "DENY");
            }
            if (!response.containsHeader("X-Content-Type-Options")) {
                response.setHeader("X-Content-Type-Options", "nosniff");
            }
            if (!response.containsHeader("X-XSS-Protection")) {
                response.setHeader("X-XSS-Protection", "1; mode=block");
            }
            if (!response.containsHeader("Referrer-Policy")) {
                response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            }
            if (!response.containsHeader("Permissions-Policy")) {
                response.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()");
            }
            response.setHeader("Server", "");
            response.setHeader("X-Powered-By", "");
        }
    }
}

