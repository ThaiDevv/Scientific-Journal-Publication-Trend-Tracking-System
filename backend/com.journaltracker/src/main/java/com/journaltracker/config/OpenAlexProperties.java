package com.journaltracker.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "external-api.openalex")
public class OpenAlexProperties {

    private String baseUrl = "https://api.openalex.org";

    private String email = "your_team_email@gmail.com";

    private int perPage = 25;
}
