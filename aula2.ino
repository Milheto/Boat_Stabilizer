#include <PID_v1.h>
#include "Wire.h"           
#include <MPU6050_light.h>  
//#include <PWMServo.h>       
#include "Servo.h"
int motor = 11;         //porta o motor
int motor_speed = 135;  // minima rotação do motor

Servo servo_motor;  // servo motor declarado


//PID _______________________________________________________________________________
double SetP, PV, CV;  // declare setpoint, process variable and control variable objects
double Pk1 = 1.5;  //gain
double Ik1 = 0.05;    //integral
double Dk1 = 0.014;     // derivative ( off )

PID PID1(&PV, &CV, &SetP, Pk1, Ik1, Dk1, DIRECT);  // parabemetros da PID

//IMU data

MPU6050 mpu(Wire);        // comunicando com o mpu
unsigned long timer = 0;  

void setup()  //executes once upon energizing
{
  Serial.begin(9600);
  pinMode(motor, OUTPUT);
  analogWrite(motor, 113);  //idle value for motors ESC
  delay(5000);              // gives ESC enough time to recognize idle command as it starts up

  servo_motor.attach(10); // define pino do servo_motor como 10
  servo_motor.write(105);  // centro mais proximo em graus

  //PID________________________________________________________________________________
  PID1.SetMode(AUTOMATIC);  //  probably change this to MANUAL and have the HMI change to AUTOMATIC
  PID1.SetOutputLimits(-25, 25);
  PID1.SetSampleTime(10);  // milliseconds

  //IMU________________________________________________________________________________
  Wire.begin();
  byte status = mpu.begin();
  while (status != 0) {}  
  mpu.calcOffsets();   
}

void loop()  //continuous control loop
{
  //IMU______________________________________________________________________________
  mpu.update();
  if ((millis() - timer) > 10)  // get data every 10ms
  {
    PV = (mpu.getAngleY());  // update PV
    timer = millis();

    // Impressão dos ângulos X, Y, Z
    //Serial.print("X: ");
    //Serial.print(mpu.getAngleX());
    //Serial.print(" | Y: ");
    //Serial.print(mpu.getAngleY());
    //Serial.print(" | Z: ");
    //Serial.println(mpu.getAngleZ());
  }

  //PID control______________________________________________________________________
  SetP = 0.0;             //declare setpoint to be 0 degrees (centered)
  if (PV > 2 or PV < -2)  // creates +/- 2 degree deadband about center
  {
    PID1.Compute();  // PID updates inputs and output values
  }

  //Servo____________________________________________________________________________
  int servo_pos = map(CV, -25, 25, 75, 125);  //scale PID output to +/- 25 degrees about centerpoint
  servo_motor.write(servo_pos);              // update servo position


  //Motor control____________________________________________________________________
  analogWrite(motor, motor_speed);  //motor just turns on at lowest RPM setting
}
