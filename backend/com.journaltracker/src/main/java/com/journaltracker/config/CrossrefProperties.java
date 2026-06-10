package com.journaltracker.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "external-api.crossref")
public class CrossrefProperties {

    private String baseUrl = "https://api.crossref.org";

    private String userAgent = "JournalTracker/1.0 (mailto:your@email.com)";

    private int rows = 25;
}
