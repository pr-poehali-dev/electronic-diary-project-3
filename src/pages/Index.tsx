import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

const API_AUTH = 'https://functions.poehali.dev/1fa274be-9623-4944-98ad-cbb58e600c51';
const API_ADMIN = 'https://functions.poehali.dev/a9a76387-8a57-449e-8024-e988072be345';
const API_GRADES = 'https://functions.poehali.dev/1de964af-0e0e-4343-b359-f7ca46b4b3b6';

interface User {
  id: number;
  login: string;
  role: string;
  full_name: string;
}

interface Class {
  id: number;
  name: string;
  year: number;
}

interface Subject {
  id: number;
  name: string;
}

interface Teacher {
  id: number;
  full_name: string;
  login: string;
}

interface Student {
  id: number;
  full_name: string;
  login: string;
  class_name: string;
  class_id: number;
}

interface Grade {
  grade: number;
  date: string;
  comment: string;
}

interface StudentGrades {
  student_id: number;
  student_name: string;
  grades: Grade[];
  average: number;
}

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [gradesData, setGradesData] = useState<StudentGrades[]>([]);

  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);

  const [newClassName, setNewClassName] = useState('');
  const [newClassYear, setNewClassYear] = useState('2025');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherLogin, setNewTeacherLogin] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentLogin, setNewStudentLogin] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch(API_AUTH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password })
      });
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setIsLoggedIn(true);
        toast.success('Вход выполнен');
      } else {
        toast.error('Неверный логин или пароль');
      }
    } catch (error) {
      toast.error('Ошибка входа');
    }
  };

  const loadClasses = async () => {
    const response = await fetch(`${API_ADMIN}?entity=classes`);
    const data = await response.json();
    setClasses(data.data || []);
  };

  const loadSubjects = async () => {
    const response = await fetch(`${API_ADMIN}?entity=subjects`);
    const data = await response.json();
    setSubjects(data.data || []);
  };

  const loadTeachers = async () => {
    const response = await fetch(`${API_ADMIN}?entity=teachers`);
    const data = await response.json();
    setTeachers(data.data || []);
  };

  const loadStudents = async () => {
    const response = await fetch(`${API_ADMIN}?entity=students`);
    const data = await response.json();
    setStudents(data.data || []);
  };

  const loadGrades = async () => {
    if (!selectedClass || !selectedSubject) return;
    
    const response = await fetch(`${API_GRADES}?class_id=${selectedClass}&subject_id=${selectedSubject}`);
    const data = await response.json();
    setGradesData(data.data || []);
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadClasses();
      loadSubjects();
      loadTeachers();
      loadStudents();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      loadGrades();
    }
  }, [selectedClass, selectedSubject]);

  const createClass = async () => {
    try {
      await fetch(`${API_ADMIN}?entity=class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName, year: parseInt(newClassYear) })
      });
      toast.success('Класс создан');
      setNewClassName('');
      loadClasses();
    } catch (error) {
      toast.error('Ошибка создания класса');
    }
  };

  const createSubject = async () => {
    try {
      await fetch(`${API_ADMIN}?entity=subject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName })
      });
      toast.success('Предмет создан');
      setNewSubjectName('');
      loadSubjects();
    } catch (error) {
      toast.error('Ошибка создания предмета');
    }
  };

  const createTeacher = async () => {
    try {
      await fetch(`${API_ADMIN}?entity=teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          login: newTeacherLogin, 
          password: newTeacherPassword, 
          full_name: newTeacherName 
        })
      });
      toast.success('Учитель создан');
      setNewTeacherName('');
      setNewTeacherLogin('');
      setNewTeacherPassword('');
      loadTeachers();
    } catch (error) {
      toast.error('Ошибка создания учителя');
    }
  };

  const createStudent = async () => {
    try {
      await fetch(`${API_ADMIN}?entity=student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          login: newStudentLogin, 
          password: newStudentPassword, 
          full_name: newStudentName,
          class_id: parseInt(newStudentClass) || null
        })
      });
      toast.success('Ученик создан');
      setNewStudentName('');
      setNewStudentLogin('');
      setNewStudentPassword('');
      setNewStudentClass('');
      loadStudents();
    } catch (error) {
      toast.error('Ошибка создания ученика');
    }
  };

  const addGrade = async (studentId: number, grade: number) => {
    try {
      await fetch(API_GRADES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          subject_id: selectedSubject,
          teacher_id: null,
          grade: grade,
          grade_date: new Date().toISOString().split('T')[0],
          comment: ''
        })
      });
      toast.success('Оценка добавлена');
      loadGrades();
    } catch (error) {
      toast.error('Ошибка добавления оценки');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Электронный дневник</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Логин</Label>
              <Input 
                value={login} 
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Введите логин"
              />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input 
                type="password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              Войти
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Электронный дневник</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.full_name}</span>
            <Button variant="outline" onClick={() => setIsLoggedIn(false)}>
              Выход
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="journal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="journal">
              <Icon name="BookOpen" size={18} className="mr-2" />
              Журнал оценок
            </TabsTrigger>
            <TabsTrigger value="admin">
              <Icon name="Settings" size={18} className="mr-2" />
              Администрирование
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Журнал оценок</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Класс</Label>
                    <Select value={selectedClass?.toString()} onValueChange={(v) => setSelectedClass(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите класс" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Предмет</Label>
                    <Select value={selectedSubject?.toString()} onValueChange={(v) => setSelectedSubject(parseInt(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите предмет" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedClass && selectedSubject && (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="bg-primary text-primary-foreground">Ученик</TableHead>
                          <TableHead className="bg-primary text-primary-foreground">Оценки</TableHead>
                          <TableHead className="bg-primary text-primary-foreground">Средний балл</TableHead>
                          <TableHead className="bg-primary text-primary-foreground">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gradesData.map((student) => (
                          <TableRow key={student.student_id}>
                            <TableCell className="font-medium">{student.student_name}</TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {student.grades.map((g, idx) => (
                                  <span 
                                    key={idx}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded text-sm font-semibold ${
                                      g.grade === 5 ? 'bg-green-100 text-green-800' :
                                      g.grade === 4 ? 'bg-blue-100 text-blue-800' :
                                      g.grade === 3 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {g.grade}
                                  </span>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-lg">{student.average.toFixed(2)}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {[5, 4, 3, 2].map(grade => (
                                  <Button
                                    key={grade}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addGrade(student.student_id, grade)}
                                  >
                                    {grade}
                                  </Button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="School" size={20} />
                    Классы
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input 
                      placeholder="Название класса" 
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                    />
                    <Input 
                      placeholder="Год" 
                      type="number"
                      value={newClassYear}
                      onChange={(e) => setNewClassYear(e.target.value)}
                    />
                    <Button onClick={createClass} className="w-full">Создать класс</Button>
                  </div>
                  <div className="space-y-2">
                    {classes.map(c => (
                      <div key={c.id} className="p-2 bg-gray-50 rounded">{c.name} ({c.year})</div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="BookOpen" size={20} />
                    Предметы
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input 
                      placeholder="Название предмета" 
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                    />
                    <Button onClick={createSubject} className="w-full">Создать предмет</Button>
                  </div>
                  <div className="space-y-2">
                    {subjects.map(s => (
                      <div key={s.id} className="p-2 bg-gray-50 rounded">{s.name}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="UserCheck" size={20} />
                    Учителя
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input 
                      placeholder="ФИО" 
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                    />
                    <Input 
                      placeholder="Логин" 
                      value={newTeacherLogin}
                      onChange={(e) => setNewTeacherLogin(e.target.value)}
                    />
                    <Input 
                      placeholder="Пароль" 
                      type="password"
                      value={newTeacherPassword}
                      onChange={(e) => setNewTeacherPassword(e.target.value)}
                    />
                    <Button onClick={createTeacher} className="w-full">Создать учителя</Button>
                  </div>
                  <div className="space-y-2">
                    {teachers.map(t => (
                      <div key={t.id} className="p-2 bg-gray-50 rounded">{t.full_name}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Users" size={20} />
                    Ученики
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input 
                      placeholder="ФИО" 
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                    />
                    <Input 
                      placeholder="Логин" 
                      value={newStudentLogin}
                      onChange={(e) => setNewStudentLogin(e.target.value)}
                    />
                    <Input 
                      placeholder="Пароль" 
                      type="password"
                      value={newStudentPassword}
                      onChange={(e) => setNewStudentPassword(e.target.value)}
                    />
                    <Select value={newStudentClass} onValueChange={setNewStudentClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите класс" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={createStudent} className="w-full">Создать ученика</Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {students.map(s => (
                      <div key={s.id} className="p-2 bg-gray-50 rounded text-sm">
                        {s.full_name} {s.class_name ? `(${s.class_name})` : ''}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
