package com.journaltracker.dto.response;

import com.journaltracker.entity.FollowType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
@Builder
@Getter
@Setter
public class FollowResponse {
    private Long id;
    private Long targetId;
    private String targetName;
    private FollowType followType;
    private LocalDateTime createdAt;
    private Integer paperCount;
}
