package com.daansetu.config;

import com.daansetu.enums.DonationType;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class DonationTypeConverter implements Converter<String, DonationType> {

    @Override
    public DonationType convert(String source) {
        return DonationType.fromValue(source);
    }
}
