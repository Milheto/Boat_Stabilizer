#include <PID_v1.h>
#include "Wire.h"           
#include <MPU6050_light.h>  
#include "Servo.h"

int motor = 9;         // porta do motor (corrigido para 12)
int motor_speed = 135;  // mínima rotação do motor

Servo servo_motor_yaw_esq;  // servo motor esquerdo
Servo servo_motor_yaw_dir;  // servo motor direito

// Parametros para mandar para o esp32
int servo_pos_esq;
int servo_pos_dir;
int yawOffset;

//PID _______________________________________________________________________________
double SetP, PV, CV;  // setpoint, process variable, control variable
double Pk1 = 1.5;     // ganho proporcional
double Ik1 = 0.05;    // integral
double Dk1 = 0.014;   // derivativo

PID PID1(&PV, &CV, &SetP, Pk1, Ik1, Dk1, DIRECT);

//IMU data
MPU6050 mpu(Wire);        
unsigned long timer = 0;  
unsigned long timer2 = 0;

void setup()  
{
  Serial.begin(9600);
  pinMode(motor, OUTPUT);
  analogWrite(motor, 113);  // idle para ESC
  delay(5000);              // tempo para ESC reconhecer idle

  // Servos
  servo_motor_yaw_esq.attach(11); 
  servo_motor_yaw_dir.attach(10);
  servo_motor_yaw_esq.write(84);  
  servo_motor_yaw_dir.write(81);

  // PID
  PID1.SetMode(AUTOMATIC);
  PID1.SetOutputLimits(-25, 25);
  PID1.SetSampleTime(10);

  // IMU
  Wire.begin();
  byte status = mpu.begin();
  while (status != 0) {}  
  mpu.calcOffsets();   
  yawOffset = mpu.getAngleZ();
  Serial.print("Yaw offset inicial: ");
  Serial.println(yawOffset);
}

void loop()  
{
  // IMU
  mpu.update();
  if ((millis() - timer) > 10) {
    PV = (mpu.getAngleZ() - yawOffset);  
    timer = millis();
  }

  // PID control
  SetP = 0.0;             
  if (PV > 2 || PV < -2) {  
    PID1.Compute();  
  }

  // Servos
  servo_pos_esq = map(CV, -25, 25, 75, 125);   // normal
  servo_pos_dir = map(CV, -25, 25, 125, 75);   // inverso
  servo_motor_yaw_esq.write(servo_pos_esq);    
  servo_motor_yaw_dir.write(servo_pos_dir);

  // Motor
  analogWrite(motor, motor_speed);  
}
