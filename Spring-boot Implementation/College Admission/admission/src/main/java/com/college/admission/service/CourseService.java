package com.college.admission.service;
import com.college.admission.model.Course;
import com.college.admission.repository.CourseRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public Optional<Course> getCourseById(Integer id) {
        return courseRepository.findById(id);
    }

    public Course createCourse(Course course) {
        return courseRepository.save(course);
    }

    public Course updateCourse(Integer id, Course courseDetails) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found with id: " + id));
        course.setCourseName(courseDetails.getCourseName());
        course.setDepartment(courseDetails.getDepartment());
        course.setCredits(courseDetails.getCredits());
        course.setDuration(courseDetails.getDuration());
        return courseRepository.save(course);
    }

    public void deleteCourse(Integer id) {
        courseRepository.deleteById(id);
    }
}
