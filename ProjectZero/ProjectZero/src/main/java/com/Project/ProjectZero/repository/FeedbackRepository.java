package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, String> {
    List<Feedback> findByHotelIdOrderByCreatedAtDesc(Long hotelId);

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.hotelId = ?1")
    Double getAverageRatingByHotelId(Long hotelId);

    long countByHotelId(Long hotelId);
}
