package com.novasalud.config;
import com.fasterxml.jackson.databind.cfg.*;
import com.fasterxml.jackson.databind.type.LogicalType;
import org.springframework.context.annotation.*;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
@Configuration
public class JsonConfig {
 @Bean Jackson2ObjectMapperBuilderCustomizer strictStrings(){return builder->builder.postConfigurer(mapper->{
  var strings=mapper.coercionConfigFor(LogicalType.Textual);
  for(var shape:new CoercionInputShape[]{CoercionInputShape.Integer,CoercionInputShape.Float,CoercionInputShape.Boolean}) strings.setCoercion(shape,CoercionAction.Fail);
 });}
}
