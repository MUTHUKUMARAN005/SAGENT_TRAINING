// File: src/main/java/com/healthcare/service/AppointmentService.java
package com.healthcare.service;

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

    public Appointment createAppointment(Appointment appointment) {
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