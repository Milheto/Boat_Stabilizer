#include "mpu6050.h"
#include <GFButton.h>

//Inicializacao global
int ledVermelha = 2;
int ledVerde = 4;
GFButton botao(A1);
unsigned long instanteAnteriorDeDeteccao = 0;
bool configuracaoInicial = false;


void setup() {
  Serial.begin(9600);
  pinMode(ledVermelha, OUTPUT);
  pinMode(ledVerde, OUTPUT);
  botao.setPressHandler(calibrar);

  digitalWrite(ledVermelha, HIGH);

  digitalWrite(ledVerde, LOW);
}

void loop() {
  // put your main code here, to run repeatedly:

  botao.process();
  if (configuracaoInicial) {
    mpu_loop();
    if (millis() > instanteAnteriorDeDeteccao + 500) {
      instanteAnteriorDeDeteccao = millis();
      
      Serial.print(getAngleX());
      Serial.print(":");
      Serial.println(getAngleY());
    }
  }
}

void calibrar() {
  mpu_begin();
  digitalWrite(ledVerde, LOW);
  
  digitalWrite(ledVermelha, LOW);
  delay(500);
  digitalWrite(ledVermelha, HIGH);
  delay(750);
  digitalWrite(ledVermelha, LOW);
  delay(500);
  digitalWrite(ledVermelha, HIGH);
  delay(750);
  digitalWrite(ledVermelha, LOW);
  mpu_calibrate(400);
  
  digitalWrite(ledVerde, HIGH);
  mpu_reset();
  configuracaoInicial = true;
}