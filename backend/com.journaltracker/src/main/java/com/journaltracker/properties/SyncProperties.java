package com.journaltracker.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "sync")
public class SyncProperties {

    private String cron;
    private boolean enabled;
    private String defaultQuery;
    private int maxPagesPerSync;
}
