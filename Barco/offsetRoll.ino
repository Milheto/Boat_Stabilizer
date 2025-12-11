#include "Servo.h"

Servo servo_motor_dir_roll; //10 Maior / 80
Servo servo_motor_esq_roll; //11 Menor / 90

                             

int variavel = 0; // Se + 
void setup()  
{
  Serial.begin(9600);
  variavel = 20; // se + vira pra cima, se é - vira pra baixo
  servo_motor_esq_roll.attach(6); // define pino do servo_motor como 10
  servo_motor_dir_roll.attach(5); // define pino do servo_motor como 10


  servo_motor_dir_roll.write(86 - variavel);  // centro mais proximo em graus
  servo_motor_esq_roll.write(71 + variavel); 
}

void loop(){

}
  
