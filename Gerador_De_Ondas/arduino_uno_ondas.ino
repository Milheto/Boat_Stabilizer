#include <Servo.h>

// ---------------- SERVO 1 ----------------
Servo servo1;
int posicaoServo1 = 90;
int sentidoServo1 = 0;
int terminoServo1 = 0;

int posicaoInicialServo1 = 35;
int posicaoFinalServo1 = 110;
int tempoIdaServo1 = 600;
int tempoVoltaServo1 = 900;
int tempoParadoServo1 = 100;

int controleServo1 = 1;

unsigned long deteccaoServo1 = 0;
unsigned long deteccaoIntervaloServo1 = 0;

// ---------------- SERVO 2 ----------------
Servo servo2;
int posicaoServo2 = 90;
int sentidoServo2 = 0;
int terminoServo2 = 0;

int posicaoInicialServo2 = 30;
int posicaoFinalServo2 = 110;
int tempoIdaServo2 = 600;
int tempoVoltaServo2 = 900;
int tempoParadoServo2 = 100;

int controleServo2 = 1;

unsigned long deteccaoServo2 = 0;
unsigned long deteccaoIntervaloServo2 = 0;

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  //Serial.begin(9600);

  servo1.attach(9);
  servo2.attach(10);

  servo1.write(posicaoServo1);
  servo2.write(posicaoServo2);
}

void loop() {
  // put your main code here, to run repeatedly:

  // SERVO 1 -----------------------------------------
  if (controleServo1 == 1) {

    if (terminoServo1 == 0) {

      if (sentidoServo1 == 0) {  // indo
        if (millis() > deteccaoServo1 + tempoIdaServo1 / max(1, (posicaoFinalServo1 - posicaoInicialServo1))) {
          Serial.println(posicaoServo1);
          servo1.write(posicaoServo1);
          posicaoServo1++;
          deteccaoServo1 = millis();
        }
      } else {  // voltando
        if (millis() > deteccaoServo1 + tempoVoltaServo1 / max(1, (posicaoFinalServo1 - posicaoInicialServo1))) {
          Serial.println(posicaoServo1);
          servo1.write(posicaoServo1);
          posicaoServo1--;
          deteccaoServo1 = millis();
        }
      }

      if (posicaoServo1 >= posicaoFinalServo1) sentidoServo1 = 1;
      if (posicaoServo1 <= posicaoInicialServo1) {
        if (sentidoServo1 == 1) {
          terminoServo1 = 1;
          deteccaoIntervaloServo1 = millis();
        }
        sentidoServo1 = 0;
      }
    }

    if (terminoServo1 == 1 && millis() > deteccaoIntervaloServo1 + tempoParadoServo1) {
      terminoServo1 = 0;
    }

  } else {
    servo1.write(90);
  }


  // SERVO 2 -----------------------------------------
  if (controleServo2 == 1) {

    if (terminoServo2 == 0) {

      if (sentidoServo2 == 0) {
        if (millis() > deteccaoServo2 + tempoIdaServo2 / max(1, (posicaoFinalServo2 - posicaoInicialServo2))) {
          servo2.write(posicaoServo2);
          posicaoServo2++;
          deteccaoServo2 = millis();
        }
      } else {
        if (millis() > deteccaoServo2 + tempoVoltaServo2 / max(1, (posicaoFinalServo2 - posicaoInicialServo2))) {
          servo2.write(posicaoServo2);
          posicaoServo2--;
          deteccaoServo2 = millis();
        }
      }

      if (posicaoServo2 >= posicaoFinalServo2) sentidoServo2 = 1;
      if (posicaoServo2 <= posicaoInicialServo2) {
        if (sentidoServo2 == 1) {
          terminoServo2 = 1;
          deteccaoIntervaloServo2 = millis();
        }
        sentidoServo2 = 0;
      }
    }

    if (terminoServo2 == 1 && millis() > deteccaoIntervaloServo2 + tempoParadoServo2) {
      terminoServo2 = 0;
    }

  } else {
    servo2.write(90);
  }
}
