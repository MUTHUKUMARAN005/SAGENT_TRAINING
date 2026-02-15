package com.college.admission.service;
import com.college.admission.model.Document;
import com.college.admission.repository.DocumentRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DocumentService {

    private final DocumentRepository repo;

    public DocumentService(DocumentRepository repo){
        this.repo = repo;
    }

    public List<Document> getAll(){ return repo.findAll(); }

    public Document getById(Integer id){ return repo.findById(id).orElseThrow(); }

    public Document save(Document obj){ return repo.save(obj); }

    public void delete(Integer id){ repo.deleteById(id); }
}
