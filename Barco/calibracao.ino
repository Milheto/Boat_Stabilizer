#include <Servo.h>

Servo esc;

void setup() {
  Serial.begin(9600);
  esc.attach(9);

  Serial.println("====== CALIBRACAO DE ESC ======");
  Serial.println("1) Desligue a bateria do ESC.");
  Serial.println("2) Aperte o RESET do Arduino.");
  Serial.println("3) Assim que vir a mensagem abaixo, LIGUE a bateria do ESC.");
  Serial.println("Enviando sinal MAXIMO (2000)...");

  esc.writeMicroseconds(2000); // Sinal máximo
  delay(3000);  // Tempo para você ligar a bateria

  Serial.println("Recebendo bipes do ESC? Agora enviando MINIMO (1000)...");
  esc.writeMicroseconds(1000);  // Mínimo

  Serial.println("Aguarde os bipes finais...");
  delay(3000);

  Serial.println("CALIBRACAO CONCLUIDA!");
  Serial.println("Agora pode carregar outro código para controlar o motor.");
}

void loop() {}
