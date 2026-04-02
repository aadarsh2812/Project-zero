package com.hotel.repository;

import com.hotel.model.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Long> {
    List<MenuCategory> findByHotelIdOrderByDisplayOrderAsc(Long hotelId);
    void deleteByIdAndHotelId(Long id, Long hotelId);
}
