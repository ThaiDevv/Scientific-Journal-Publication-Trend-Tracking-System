package com.journaltracker.service;

import com.journaltracker.dto.SyncResult;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicReference;

@Component
public class SyncStatusService {
    private final AtomicReference<SyncResult> last = new AtomicReference<>();
    private final java.util.concurrent.atomic.AtomicBoolean running = new java.util.concurrent.atomic.AtomicBoolean(false);

    public void setLast(SyncResult r) {
        last.set(r);
    }

    public SyncResult getLast() {
        return last.get();
    }
}
