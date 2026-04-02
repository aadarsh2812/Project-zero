package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    List<MenuCategory> findByHotelIdOrderByDisplayOrderAsc(Long hotelId);
}
