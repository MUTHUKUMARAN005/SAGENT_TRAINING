// File: src/main/java/com/healthcare/repository/AppointmentRepository.java
package com.healthcare.repository;

import com.healthcare.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    List<Appointment> findByPatientPatientId(Integer patientId);
    List<Appointment> findByDoctorDoctorId(Integer doctorId);
    List<Appointment> findByStatus(Appointment.Status status);
    long countByStatus(Appointment.Status status);
}