import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('courses')
export class CoursesController {
    @Get()
    // @UseGuards(AuthGuard) // Optional: restrict to logged-in users? User asked for demo page after login, so yes.
    findAll() {
        // Demo Content
        return [
            {
                id: '1',
                title: 'Full Stack Web Development',
                description: 'Learn to build modern web apps with React and Node.js',
                instructor: 'Dr. Angela Yu',
                progress: 0,
                totalModules: 12,
                imageUrl: 'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?auto=format&fit=crop&w=800&q=80',
            },
            {
                id: '2',
                title: 'Machine Learning A-Z',
                description: 'Master Machine Learning with Python and R',
                instructor: 'Kirill Eremenko',
                progress: 0,
                totalModules: 10,
                imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
            },
            {
                id: '3',
                title: 'The Complete Python Bootcamp',
                description: 'Learn Python like a Professional! Start from the basics and go all the way to creating your own applications and games!',
                instructor: 'Jose Portilla',
                progress: 0,
                totalModules: 15,
                imageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=800&q=80',
            }
        ];
    }
}
