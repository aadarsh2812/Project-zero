package com.Project.ProjectZero.config;

import com.Project.ProjectZero.model.*;
import com.Project.ProjectZero.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final HotelRepository hotelRepo;
    private final MenuCategoryRepository catRepo;
    private final MenuItemRepository itemRepo;
    private final KitchenStaffRepository staffRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (hotelRepo.count() > 0) return;

        log.info("Seeding initial data...");
        Hotel hotel = hotelRepo.save(Hotel.builder()
                .name("The Grand Hotel")
                .address("123 Main Street, City Center")
                .adminUsername("admin")
                .adminPassword("admin123")
                .build());

        MenuCategory s = catRepo.save(MenuCategory.builder().name("Starters").hotelId(hotel.getId()).displayOrder(1).build());
        MenuCategory m = catRepo.save(MenuCategory.builder().name("Main Course").hotelId(hotel.getId()).displayOrder(2).build());
        MenuCategory d = catRepo.save(MenuCategory.builder().name("Drinks").hotelId(hotel.getId()).displayOrder(3).build());
        MenuCategory ds = catRepo.save(MenuCategory.builder().name("Desserts").hotelId(hotel.getId()).displayOrder(4).build());

        // Starters
        saveItem(hotel.getId(), s.getId(), "Garlic Bread", "Toasted garlic bread with herb butter", "4.99",
                "https://images.unsplash.com/photo-1573140401552-3fab0b24306f?w=400");
        saveItem(hotel.getId(), s.getId(), "Tomato Soup", "Classic homemade tomato soup with croutons", "5.99",
                "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400");
        saveItem(hotel.getId(), s.getId(), "Caesar Salad", "Fresh romaine with caesar dressing & parmesan", "7.99",
                "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400");
        // Mains
        saveItem(hotel.getId(), m.getId(), "Grilled Chicken", "Herb-marinated chicken with seasonal vegetables", "14.99",
                "https://images.unsplash.com/photo-1598103442097-8b74394b95c2?w=400");
        saveItem(hotel.getId(), m.getId(), "Pasta Carbonara", "Creamy pasta with bacon & parmesan", "12.99",
                "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400");
        saveItem(hotel.getId(), m.getId(), "Beef Burger", "Juicy beef patty with lettuce, tomato, cheese", "13.99",
                "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400");
        saveItem(hotel.getId(), m.getId(), "Margherita Pizza", "Classic tomato sauce & fresh mozzarella", "11.99",
                "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400");
        // Drinks
        saveItem(hotel.getId(), d.getId(), "Fresh Orange Juice", "Freshly squeezed orange juice", "3.99",
                "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400");
        saveItem(hotel.getId(), d.getId(), "Iced Coffee", "Cold brew iced coffee with milk", "4.49",
                "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400");
        saveItem(hotel.getId(), d.getId(), "Sparkling Water", "500ml sparkling mineral water", "2.49",
                "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400");
        // Desserts
        saveItem(hotel.getId(), ds.getId(), "Chocolate Lava Cake", "Warm chocolate cake with molten center", "6.99",
                "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400");
        saveItem(hotel.getId(), ds.getId(), "Ice Cream Sundae", "3 scoops with toppings of your choice", "5.49",
                "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400");

        // Kitchen staff
        KitchenStaff staff = KitchenStaff.builder()
                .username("kitchen1")
                .passwordHash(passwordEncoder.encode("kitchen123"))
                .name("Chef Kumar")
                .hotelId(hotel.getId())
                .build();
        staffRepo.save(staff);

        log.info("==========================================");
        log.info("  Hotel ID: {} | Code: {}", hotel.getId(), hotel.getHotelCode());
        log.info("  Admin: admin / admin123");
        log.info("  Kitchen: kitchen1 / kitchen123 (hotelId={})", hotel.getId());
        log.info("==========================================");
    }

    private void saveItem(Long hotelId, Long catId, String name, String desc, String price, String img) {
        itemRepo.save(MenuItem.builder()
                .hotelId(hotelId).categoryId(catId)
                .name(name).description(desc)
                .price(new BigDecimal(price)).imageUrl(img).available(true)
                .build());
    }
}
