package com.college.admission.service;
import com.college.admission.model.College;
import com.college.admission.repository.CollegeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CollegeService {

    @Autowired
    private CollegeRepository collegeRepository;

    public List<College> getAllColleges() {
        return collegeRepository.findAll();
    }

    public Optional<College> getCollegeById(Integer id) {
        return collegeRepository.findById(id);
    }

    public College createCollege(College college) {
        return collegeRepository.save(college);
    }

    public College updateCollege(Integer id, College collegeDetails) {
        College college = collegeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("College not found with id: " + id));
        college.setCollegeName(collegeDetails.getCollegeName());
        college.setLocation(collegeDetails.getLocation());
        return collegeRepository.save(college);
    }

    public void deleteCollege(Integer id) {
        collegeRepository.deleteById(id);
    }
}