package com.example.demo.controller;

import com.example.demo.entity.RestaurantTable;
import com.example.demo.repository.RestaurantTableRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tables")
public class TableController {
    private final RestaurantTableRepository tableRepository;
    private final com.example.demo.repository.HotelRepository hotelRepository;

    public TableController(RestaurantTableRepository tableRepository, com.example.demo.repository.HotelRepository hotelRepository) {
        this.tableRepository = tableRepository;
        this.hotelRepository = hotelRepository;
    }

    @GetMapping
    public List<RestaurantTable> getTables(@RequestParam(required = false) String hotelId) {
        if (hotelId != null) {
            return tableRepository.findByHotelId(hotelId);
        }
        return tableRepository.findAll();
    }

    @PostMapping
    public RestaurantTable saveTable(@RequestBody RestaurantTable table, @RequestParam(required = false) String hotelId) {
        if (hotelId != null) {
            hotelRepository.findById(hotelId).ifPresent(table::setHotel);
        }
        return tableRepository.save(table);
    }

    @DeleteMapping("/{id}")
    public void deleteTable(@PathVariable String id) {
        tableRepository.deleteById(id);
    }
}
