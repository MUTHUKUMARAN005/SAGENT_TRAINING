// File: src/main/java/com/healthcare/service/AppointmentService.java
package com.healthcare.service;

import com.healthcare.dto.AppointmentRequest;
import com.healthcare.model.*;
import com.healthcare.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public List<Appointment> getByPatientId(Integer patientId) {
        return appointmentRepository.findByPatientPatientId(patientId);
    }

    public List<Appointment> getByDoctorId(Integer doctorId) {
        return appointmentRepository.findByDoctorDoctorId(doctorId);
    }

    public Appointment getById(Integer id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
    }

    // ✅ FIXED: Accept DTO and resolve entities from database
    public Appointment createAppointment(AppointmentRequest request) {

        // Look up the actual Doctor entity
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException(
                        "Doctor not found with id: " + request.getDoctorId()));

        // Look up the actual Patient entity
        Patient patient = patientRepository.findById(request.getPatientId())
                .orElseThrow(() -> new RuntimeException(
                        "Patient not found with id: " + request.getPatientId()));

        // Build the appointment with managed entities
        Appointment appointment = Appointment.builder()
                .doctor(doctor)           // ✅ Managed entity from DB
                .patient(patient)         // ✅ Managed entity from DB
                .dateTime(request.getDateTime())
                .reason(request.getReason())
                .status(Appointment.Status.SCHEDULED)  // Default status
                .build();

        return appointmentRepository.save(appointment);
    }

    public Appointment updateStatus(Integer id, Appointment.Status status) {
        Appointment appointment = getById(id);
        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }

    public void deleteAppointment(Integer id) {
        appointmentRepository.deleteById(id);
    }
}