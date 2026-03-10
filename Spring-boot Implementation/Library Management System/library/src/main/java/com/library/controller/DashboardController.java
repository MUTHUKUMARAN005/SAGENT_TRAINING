// controller/DashboardController.java
package com.library.controller;

import com.library.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final BookService bookService;
    private final MemberService memberService;
    private final LibraryService libraryService;
    private final BorrowingRecordService borrowingRecordService;
    private final FineService fineService;
    private final RequestService requestService;
    private final BookCopyService bookCopyService;

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBooks", bookService.count());
        stats.put("totalMembers", memberService.count());
        stats.put("activeMembers", memberService.countActive());
        stats.put("totalLibraries", libraryService.count());
        stats.put("activeBorrowings", borrowingRecordService.countActive());
        stats.put("overdueBorrowings", borrowingRecordService.countOverdue());
        stats.put("unpaidFines", fineService.countUnpaid());
        stats.put("totalUnpaidAmount", fineService.totalUnpaid());
        stats.put("pendingRequests", requestService.countPending());
        stats.put("availableCopies", bookCopyService.countAvailable());
        return stats;
    }
}