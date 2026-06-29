import { PrismaClient, Role, AttendanceStatus, FeeStatus, SubmissionStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clean Database
  console.log("Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.fee.deleteMany();
  await prisma.result.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash Password helper
  const hashedPassword = await bcrypt.hash("Admin@123", 12);
  const profPassword = await bcrypt.hash("Prof@123", 12);
  const studentPassword = await bcrypt.hash("Student@123", 12);

  // 3. Create Admin Users
  console.log("Creating admin users...");
  const admin = await prisma.user.create({
    data: {
      name: "Administrator",
      email: "admin@unicontrol.com",
      passwordHash: hashedPassword,
      role: Role.SUPER_ADMIN,
      phone: "+1234567890",
      address: "123 University Campus Drive, Suite 100",
    },
  });

  // 4. Create Departments
  console.log("Creating departments...");
  const cse = await prisma.department.create({
    data: {
      name: "Computer Science & Engineering",
      code: "CSE",
      description: "Department of Computer Science and Engineering",
    },
  });

  const ece = await prisma.department.create({
    data: {
      name: "Electronics & Communication Engineering",
      code: "ECE",
      description: "Department of Electronics and Communication Engineering",
    },
  });

  // 5. Create Professors
  console.log("Creating professors...");
  const prof1User = await prisma.user.create({
    data: {
      name: "Dr. Robert Downey",
      email: "robert.downey@unicontrol.com",
      passwordHash: profPassword,
      role: Role.PROFESSOR,
      phone: "+1987654321",
    },
  });

  const prof1 = await prisma.professor.create({
    data: {
      employeeId: "EMP001",
      title: "Professor & Chair",
      specialization: "Artificial Intelligence & Distributed Systems",
      joiningDate: new Date("2018-08-15"),
      userId: prof1User.id,
      departmentId: cse.id,
    },
  });

  const prof2User = await prisma.user.create({
    data: {
      name: "Dr. Elizabeth Olsen",
      email: "elizabeth.olsen@unicontrol.com",
      passwordHash: profPassword,
      role: Role.PROFESSOR,
      phone: "+1987654322",
    },
  });

  const prof2 = await prisma.professor.create({
    data: {
      employeeId: "EMP002",
      title: "Associate Professor",
      specialization: "Digital VLSI Design & Signal Processing",
      joiningDate: new Date("2020-01-10"),
      userId: prof2User.id,
      departmentId: ece.id,
    },
  });

  // 6. Create Courses
  console.log("Creating courses...");
  const course1 = await prisma.course.create({
    data: {
      code: "CS101",
      title: "Introduction to Computer Science",
      description: "Basic programming concepts, variables, control flow, and arrays.",
      creditHours: 3,
      maxStudents: 50,
      departmentId: cse.id,
      professorId: prof1.id,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      code: "CS201",
      title: "Data Structures & Algorithms",
      description: "Linked lists, stacks, queues, trees, sorting algorithms, and complexity.",
      creditHours: 4,
      maxStudents: 40,
      departmentId: cse.id,
      professorId: prof1.id,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      code: "EC301",
      title: "Digital Signal Processing",
      description: "Signals, systems, Fourier transforms, z-transforms, and filter design.",
      creditHours: 3,
      maxStudents: 30,
      departmentId: ece.id,
      professorId: prof2.id,
    },
  });

  // 7. Create Students
  console.log("Creating students...");
  const studentData = [
    { name: "Alice Johnson", email: "alice.johnson@unicontrol.com", studentId: "STU001", semester: 1, deptId: cse.id },
    { name: "Bob Smith", email: "bob.smith@unicontrol.com", studentId: "STU002", semester: 2, deptId: cse.id },
    { name: "Charlie Brown", email: "charlie.brown@unicontrol.com", studentId: "STU003", semester: 3, deptId: ece.id },
    { name: "Diana Prince", email: "diana.prince@unicontrol.com", studentId: "STU004", semester: 1, deptId: cse.id },
  ];

  const students = [];
  for (const s of studentData) {
    const sUser = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        passwordHash: studentPassword,
        role: Role.STUDENT,
        phone: "+1555000" + s.studentId.replace("STU", ""),
      },
    });

    const student = await prisma.student.create({
      data: {
        studentId: s.studentId,
        enrollmentYear: 2025,
        semester: s.semester,
        userId: sUser.id,
        departmentId: s.deptId,
      },
      include: {
        user: true,
        department: true,
      },
    });
    students.push(student);
  }

  // 8. Enrollments & Attendance
  console.log("Creating enrollments & attendance records...");
  const semesterStr = "Spring 2026";
  
  // Enroll Alice and Bob in CS101 and CS201
  const enrollments = [];
  const alice = students[0];
  const bob = students[1];
  const charlie = students[2];
  const diana = students[3];

  const aliceEnroll1 = await prisma.enrollment.create({
    data: { studentId: alice.id, courseId: course1.id, semester: semesterStr },
  });
  const aliceEnroll2 = await prisma.enrollment.create({
    data: { studentId: alice.id, courseId: course2.id, semester: semesterStr },
  });
  const bobEnroll1 = await prisma.enrollment.create({
    data: { studentId: bob.id, courseId: course1.id, semester: semesterStr },
  });
  const charlieEnroll = await prisma.enrollment.create({
    data: { studentId: charlie.id, courseId: course3.id, semester: semesterStr },
  });

  enrollments.push(aliceEnroll1, aliceEnroll2, bobEnroll1, charlieEnroll);

  // Generate some attendance
  const dates = [
    new Date("2026-06-25"),
    new Date("2026-06-26"),
    new Date("2026-06-27"),
    new Date("2026-06-28"),
  ];

  for (const date of dates) {
    await prisma.attendance.create({
      data: { enrollmentId: aliceEnroll1.id, date, status: AttendanceStatus.PRESENT },
    });
    await prisma.attendance.create({
      data: { enrollmentId: aliceEnroll2.id, date, status: AttendanceStatus.PRESENT },
    });
    await prisma.attendance.create({
      data: { enrollmentId: bobEnroll1.id, date, status: date.getDate() % 2 === 0 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT },
    });
    await prisma.attendance.create({
      data: { enrollmentId: charlieEnroll.id, date, status: AttendanceStatus.LATE, remarks: "Arrived 10 mins late" },
    });
  }

  // 9. Assignments & Submissions
  console.log("Creating assignments & submissions...");
  const assignment1 = await prisma.assignment.create({
    data: {
      title: "Programming Basics: Loops and Functions",
      description: "Implement 5 standard basic exercises in Python or Javascript.",
      courseId: course1.id,
      maxScore: 100,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      title: "Lab 1: LinkedList Implementation",
      description: "Implement a Doubly Linked List with insert, delete, and find methods.",
      courseId: course2.id,
      maxScore: 100,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    },
  });

  // Alice submissions
  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: alice.id,
      content: "Here is my code for assignment 1: function main() { ... }",
      score: 95,
      feedback: "Great implementation. Good variable naming.",
      status: SubmissionStatus.GRADED,
    },
  });

  // Bob submissions (submitted but not graded yet)
  await prisma.submission.create({
    data: {
      assignmentId: assignment1.id,
      studentId: bob.id,
      content: "My submission for basic programming assignment.",
      status: SubmissionStatus.SUBMITTED,
    },
  });

  // 10. Exams & Results
  console.log("Creating exams & results...");
  const exam1 = await prisma.exam.create({
    data: {
      title: "Mid-Term CS101 Exam",
      courseId: course1.id,
      date: new Date("2026-07-15T10:00:00Z"),
      duration: 120, // 2 hours
      maxScore: 100,
      venue: "Lecture Hall A",
    },
  });

  // 11. Fees
  console.log("Creating fees...");
  await prisma.fee.create({
    data: {
      studentId: alice.id,
      amount: 45000,
      description: "Tuition Fees - Semester 1",
      dueDate: new Date("2026-05-01"),
      paidAt: new Date("2026-04-28"),
      status: FeeStatus.PAID,
      semester: "Semester 1",
    },
  });

  await prisma.fee.create({
    data: {
      studentId: bob.id,
      amount: 45000,
      description: "Tuition Fees - Semester 2",
      dueDate: new Date("2026-07-15"),
      status: FeeStatus.PENDING,
      semester: "Semester 2",
    },
  });

  await prisma.fee.create({
    data: {
      studentId: charlie.id,
      amount: 48000,
      description: "Tuition & Lab Fees - Semester 3",
      dueDate: new Date("2026-06-15"),
      status: FeeStatus.OVERDUE,
      semester: "Semester 3",
    },
  });

  await prisma.fee.create({
    data: {
      studentId: diana.id,
      amount: 45000,
      description: "Tuition Fees - Semester 1",
      dueDate: new Date("2026-06-01"),
      status: FeeStatus.WAIVED,
      semester: "Semester 1",
    },
  });

  // 12. Notices
  console.log("Creating notices...");
  await prisma.notice.create({
    data: {
      title: "Welcome to UniControl Campus Portal",
      content: "We are excited to launch the new unified university campus control portal. Here you can find your courses, schedules, assignments, attendance logs, and notices.",
      authorId: admin.id,
    },
  });

  await prisma.notice.create({
    data: {
      title: "Mid-Term Examination Dates Announced",
      content: "Midterm examinations will be conducted starting from July 12th, 2026. Please check individual course sections for details on venue, time duration, and syllabus.",
      authorId: admin.id,
      targetRole: Role.STUDENT,
    },
  });

  await prisma.notice.create({
    data: {
      title: "Faculty Senate Meeting scheduled for June 30th",
      content: "The monthly faculty senate meeting will take place in the Conference Hall B at 2 PM. Agenda items include grading policies and curriculum updates.",
      authorId: admin.id,
      targetRole: Role.PROFESSOR,
    },
  });

  // 13. Audit logs
  console.log("Creating initial audit log...");
  await prisma.auditLog.create({
    data: {
      action: "DATABASE_SEED",
      entity: "Database",
      userId: admin.id,
      details: { status: "Success", seededRecordsCount: 30 },
      ipAddress: "127.0.0.1",
    },
  });

  console.log("🌱 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
