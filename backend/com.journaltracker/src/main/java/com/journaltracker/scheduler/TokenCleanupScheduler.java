package com.journaltracker.scheduler;

import com.journaltracker.repository.RefreshTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TokenCleanupScheduler {
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void purgeExpiredTokens() {
        System.out.println("Đang chạy ngầm dọn dẹp Refresh Token rác đã hết hạn dưới MySQL...");
        refreshTokenRepository.deleteAllExpiredTokens();
    }
}