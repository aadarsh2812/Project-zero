package com.example.demo.repository;

import com.example.demo.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, String> {
    List<RestaurantTable> findByHotelId(String hotelId);
}
