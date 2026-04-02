package com.Project.ProjectZero.service;

import com.Project.ProjectZero.dto.MenuItemRequest;
import com.Project.ProjectZero.model.MenuCategory;
import com.Project.ProjectZero.model.MenuItem;
import com.Project.ProjectZero.repository.MenuCategoryRepository;
import com.Project.ProjectZero.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuCategoryRepository catRepo;
    private final MenuItemRepository itemRepo;

    public List<MenuCategory> getCategories(Long hotelId) {
        return catRepo.findByHotelIdOrderByDisplayOrderAsc(hotelId);
    }

    public List<MenuItem> getMenuItems(Long hotelId) {
        return itemRepo.findByHotelIdAndAvailableTrue(hotelId);
    }

    public List<MenuItem> getAllMenuItems(Long hotelId) {
        return itemRepo.findByHotelId(hotelId);
    }

    /** Returns structured menu: categories with their items */
    public List<Map<String, Object>> getFullMenu(Long hotelId) {
        List<MenuCategory> categories = catRepo.findByHotelIdOrderByDisplayOrderAsc(hotelId);
        List<MenuItem> items = itemRepo.findByHotelIdAndAvailableTrue(hotelId);

        List<Map<String, Object>> result = new ArrayList<>();
        for (MenuCategory cat : categories) {
            Map<String, Object> catMap = new LinkedHashMap<>();
            catMap.put("id", cat.getId());
            catMap.put("name", cat.getName());
            catMap.put("items", items.stream()
                    .filter(i -> i.getCategoryId().equals(cat.getId()))
                    .toList());
            result.add(catMap);
        }
        return result;
    }

    @Transactional
    public MenuItem createItem(Long hotelId, MenuItemRequest req) {
        return itemRepo.save(MenuItem.builder()
                .hotelId(hotelId).categoryId(req.getCategoryId())
                .name(req.getName()).description(req.getDescription())
                .price(req.getPrice()).imageUrl(req.getImageUrl())
                .available(req.getAvailable() != null ? req.getAvailable() : true)
                .build());
    }

    @Transactional
    public MenuItem updateItem(Long id, Long hotelId, MenuItemRequest req) {
        MenuItem item = itemRepo.findById(id)
                .filter(i -> i.getHotelId().equals(hotelId))
                .orElseThrow(() -> new RuntimeException("Item not found"));
        if (req.getName() != null)        item.setName(req.getName());
        if (req.getDescription() != null) item.setDescription(req.getDescription());
        if (req.getPrice() != null)       item.setPrice(req.getPrice());
        if (req.getImageUrl() != null)    item.setImageUrl(req.getImageUrl());
        if (req.getCategoryId() != null)  item.setCategoryId(req.getCategoryId());
        if (req.getAvailable() != null)   item.setAvailable(req.getAvailable());
        return itemRepo.save(item);
    }

    @Transactional
    public void deleteItem(Long id, Long hotelId) {
        itemRepo.findById(id).filter(i -> i.getHotelId().equals(hotelId))
                .ifPresent(itemRepo::delete);
    }

    @Transactional
    public MenuCategory createCategory(Long hotelId, String name) {
        int order = catRepo.findByHotelIdOrderByDisplayOrderAsc(hotelId).size() + 1;
        return catRepo.save(MenuCategory.builder().hotelId(hotelId).name(name).displayOrder(order).build());
    }

    @Transactional
    public void deleteCategory(Long id, Long hotelId) {
        catRepo.findById(id).filter(c -> c.getHotelId().equals(hotelId))
                .ifPresent(catRepo::delete);
    }
}
