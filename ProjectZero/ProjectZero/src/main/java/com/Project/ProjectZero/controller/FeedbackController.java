package com.Project.ProjectZero.controller;

import com.Project.ProjectZero.model.Feedback;
import com.Project.ProjectZero.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackRepository feedbackRepo;

    @PostMapping
    public ResponseEntity<Feedback> submit(@RequestBody Feedback feedback) {
        if (feedback.getRating() == null || feedback.getRating() < 1 || feedback.getRating() > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }
        return ResponseEntity.ok(feedbackRepo.save(feedback));
    }

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<Feedback>> getByHotel(@PathVariable Long hotelId) {
        return ResponseEntity.ok(feedbackRepo.findByHotelIdOrderByCreatedAtDesc(hotelId));
    }

    @GetMapping("/hotel/{hotelId}/summary")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable Long hotelId) {
        Double avg = feedbackRepo.getAverageRatingByHotelId(hotelId);
        long count = feedbackRepo.countByHotelId(hotelId);
        return ResponseEntity.ok(Map.of(
                "averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0,
                "totalReviews", count
        ));
    }
}
