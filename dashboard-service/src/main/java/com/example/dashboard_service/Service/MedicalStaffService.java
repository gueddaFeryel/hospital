package com.example.dashboard_service.Service;

import com.example.dashboard_service.Repository.InterventionRepository;
import com.example.dashboard_service.Repository.MedicalStaffRepository;
import com.example.dashboard_service.model.MedicalStaff;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MedicalStaffService {

    @Autowired
    private MedicalStaffRepository medicalStaffRepository;

    @Autowired
    private InterventionRepository interventionRepository;


}
