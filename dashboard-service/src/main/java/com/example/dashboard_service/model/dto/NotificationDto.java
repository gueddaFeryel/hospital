package com.example.dashboard_service.model.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

@Getter
@Setter
public class NotificationDto {
    private String userId;
    private String interventionId;
    private String type;
    private String title;
    private String message;
    private Long timestamp;
    private Map<String, Object> extraData = new HashMap<>();}
