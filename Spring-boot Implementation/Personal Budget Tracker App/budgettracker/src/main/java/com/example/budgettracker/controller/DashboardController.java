package com.example.budgettracker.controller;
import com.example.budgettracker.dto.DashboardDTO;
import com.example.budgettracker.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/{userId}")
    public DashboardDTO getDashboard(@PathVariable Integer userId) {
        return dashboardService.getDashboard(userId);
    }
}