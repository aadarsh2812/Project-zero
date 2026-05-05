package com.example.demo.controller;

import com.example.demo.entity.Category;
import com.example.demo.entity.MenuItem;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.MenuItemRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/menu")
public class MenuController {

    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final com.example.demo.repository.HotelRepository hotelRepository;

    public MenuController(CategoryRepository categoryRepository, 
                          MenuItemRepository menuItemRepository,
                          com.example.demo.repository.HotelRepository hotelRepository) {
        this.categoryRepository = categoryRepository;
        this.menuItemRepository = menuItemRepository;
        this.hotelRepository = hotelRepository;
    }

    @GetMapping("/categories")
    public List<Category> getCategories(@RequestParam(required = false) String hotelId) {
        if (hotelId != null) {
            return categoryRepository.findByHotelId(hotelId);
        }
        return categoryRepository.findAll();
    }

    @GetMapping("/items")
    public List<MenuItem> getMenuItems(@RequestParam(required = false) String hotelId) {
        if (hotelId != null) {
            return menuItemRepository.findByHotelId(hotelId);
        }
        return menuItemRepository.findAll();
    }

    @PostMapping("/items")
    public MenuItem saveMenuItem(@RequestBody MenuItem item, @RequestParam(required = false) String hotelId) {
        if (hotelId != null) {
            hotelRepository.findById(hotelId).ifPresent(item::setHotel);
        }
        return menuItemRepository.save(item);
    }

    @DeleteMapping("/items/{id}")
    public void deleteMenuItem(@PathVariable String id) {
        menuItemRepository.deleteById(id);
    }
}
