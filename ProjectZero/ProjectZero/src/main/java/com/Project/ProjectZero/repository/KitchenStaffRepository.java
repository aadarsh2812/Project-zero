package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.KitchenStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface KitchenStaffRepository extends JpaRepository<KitchenStaff, Long> {
    Optional<KitchenStaff> findByUsernameAndHotelId(String username, Long hotelId);
    List<KitchenStaff> findByHotelId(Long hotelId);
}
