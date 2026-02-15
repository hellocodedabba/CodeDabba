import { BookOpen, User, BarChart } from "lucide-react";

interface CourseProps {
    course: {
        id: string;
        title: string;
        description: string;
        imageUrl: string;
        instructor: string;
        totalModules: number;
        progress: number;
    };
}

export function CourseCard({ course }: CourseProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="relative h-48 w-full">
                <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/70 px-2 py-1 rounded text-xs font-semibold text-gray-900 dark:text-white">
                    {course.totalModules} Modules
                </div>
            </div>
            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {course.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {course.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <BarChart className="h-4 w-4" />
                        <span>{course.progress}% Complete</span>
                    </div>
                </div>

                <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                        className="bg-indigo-600 h-2.5 rounded-full"
                        style={{ width: `${course.progress}%` }}
                    ></div>
                </div>

                <button className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded transition-colors">
                    Continue Learning
                </button>
            </div>
        </div>
    );
}
