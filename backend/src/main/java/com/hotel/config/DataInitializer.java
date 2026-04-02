package com.hotel.config;

import com.hotel.model.*;
import com.hotel.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final HotelRepository hotelRepository;
    private final MenuCategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;

    @Override
    public void run(String... args) {
        if (hotelRepository.count() == 0) {
            log.info("Seeding initial hotel data...");

            Hotel hotel = hotelRepository.save(Hotel.builder()
                    .name("The Grand Hotel")
                    .address("123 Main Street, City Center")
                    .adminUsername("admin")
                    .adminPassword("admin123")
                    .build());

            MenuCategory starters = categoryRepository.save(MenuCategory.builder()
                    .name("Starters").hotelId(hotel.getId()).displayOrder(1).build());
            MenuCategory mains = categoryRepository.save(MenuCategory.builder()
                    .name("Main Course").hotelId(hotel.getId()).displayOrder(2).build());
            MenuCategory drinks = categoryRepository.save(MenuCategory.builder()
                    .name("Drinks").hotelId(hotel.getId()).displayOrder(3).build());
            MenuCategory desserts = categoryRepository.save(MenuCategory.builder()
                    .name("Desserts").hotelId(hotel.getId()).displayOrder(4).build());

            // Starters
            menuItemRepository.save(MenuItem.builder().name("Garlic Bread").description("Toasted garlic bread with butter").price(new BigDecimal("4.99")).categoryId(starters.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1573140401552-3fab0b24306f?w=400").available(true).build());
            menuItemRepository.save(MenuItem.builder().name("Tomato Soup").description("Classic homemade tomato soup").price(new BigDecimal("5.99")).categoryId(starters.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400").available(true).build());
            menuItemRepository.save(MenuItem.builder().name("Caesar Salad").description("Fresh romaine lettuce with caesar dressing").price(new BigDecimal("7.99")).categoryId(starters.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400").available(true).build());

            // Mains
            menuItemRepository.save(MenuItem.builder().name("Grilled Chicken").description("Herb-marinated grilled chicken with vegetables").price(new BigDecimal("14.99")).categoryId(mains.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1598103442097-8b74394b95c2?w=400").available(true).build());
            menuItemRepository.save(MenuItem.builder().name("Pasta Carbonara").description("Creamy pasta with bacon and parmesan").price(new BigDecimal("12.99")).categoryId(mains.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400").available(true).build());
            menuItemRepository.save(MenuItem.builder().name("Beef Burger").description("Juicy beef patty with fresh toppings").price(new BigDecimal("13.99")).categoryId(mains.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400").available(true).build());
            menuItemRepository.save(MenuItem.builder().name("Margherita Pizza").description("Classic tomato sauce and mozzarella").price(new BigDecimal("11.99")).categoryId(mains.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400").available(true).build());

            // Drinks
            menuItemRepository.save(MenuItem.builder().name("Fresh Orange Juice").description("Freshly squeezed orange juice").price(new BigDecimal("3.99")).categoryId(drinks.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400").available(true).build());
            menuItemRepository.save(MenuItem.builder().name("Iced Coffee").description("Cold brew iced coffee").price(new BigDecimal("4.49")).categoryId(drinks.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400").available(true).build());
            menuItemRepository.save(MenuItem.builder().name("Sparkling Water").description("500ml sparkling mineral water").price(new BigDecimal("2.49")).categoryId(drinks.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400").available(true).build());

            // Desserts
            menuItemRepository.save(MenuItem.builder().name("Chocolate Lava Cake").description("Warm chocolate cake with molten center").price(new BigDecimal("6.99")).categoryId(desserts.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400").available(true).build());
            menuItemRepository.save(MenuItem.builder().name("Ice Cream Sundae").description("3 scoops with toppings").price(new BigDecimal("5.49")).categoryId(desserts.getId()).hotelId(hotel.getId()).imageUrl("https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400").available(true).build());

            log.info("Seeded hotel ID={} with 12 menu items", hotel.getId());
        }
    }
}
