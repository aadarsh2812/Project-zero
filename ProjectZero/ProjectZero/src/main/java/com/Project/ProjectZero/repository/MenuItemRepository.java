package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByHotelIdAndAvailableTrue(Long hotelId);
    List<MenuItem> findByCategoryIdAndHotelId(Long categoryId, Long hotelId);
    List<MenuItem> findByHotelId(Long hotelId);
}
