// Code goes here!
interface Draggable {
    dragStartHandler(event: DragEvent): void;
    dragEndHanlder(event: DragEvent): void;
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void
    dropHandler(event: DragEvent): void;
    dragLeaveHanlder(event: DragEvent): void
}

enum Status {
   Active = 'active', Finished = 'finished'
}

class Project {
    constructor(public id: string, public title: string,public description: string, public people: number, public status: Status) {
    };
}

type Listener = (items: Project[]) => void;

class ProjectState {
    private listeners: Listener[] = []; //Arreglo de funciones
    private projects: Project[] = []; //arreglo de proyectos
    private static _intance: ProjectState; //instancia para la funcionalidad singleton

    private constructor() { //constructor privado para negar la creación de clases

    };

    addItem(title: string, description: string, people: number) { //función par añadir un nuevo proyecto al arreglo
        const newProject = new Project(
            Math.random().toString() + title.charAt(2),
            title,
            description,
            people,
            Status.Active
        );
        this.projects.push(newProject);
        for(const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    };

    moveProject(id: string, newStatus: Status) {
        const project = this.projects.find(projectItem => projectItem.id === id);

        if(project && project.status !== newStatus) {
            project.status = newStatus;
            this.updateListeners();
        }
    }

    private updateListeners() {
        for(const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
    addListener(listenerFn: Listener) {
        this.listeners.push(listenerFn);
    }

    static getInstance() { //método estático para generar la instancia (estatico es que le pertenece a la clase)
        if(!this._intance) {
            this._intance = new ProjectState();
        }
        return this._intance
    }

    
}


const projectState = ProjectState.getInstance();


interface Validatable { //interface para ver si el objetivo cumple con esa características
    value: string | number;
    required?: boolean;
    minlength?: number;
    maxlength?: number;
    min?: number;
    max?: number;
}

function ValidateData(validatableObject: Validatable) { //recibe un objeto con las características
    let isvalid = true
    if(validatableObject.required) { //primero validamos si el valor es requerido
        isvalid = isvalid && validatableObject.value.toString().trim().length !== 0;
    }
    if(typeof validatableObject.value === 'string') { //validamos el tamaño para los strings
        if(validatableObject.minlength != null) {
            isvalid = isvalid && validatableObject.value.toString().trim().length >= validatableObject.minlength;
        }
        if(validatableObject.maxlength != null) {
            isvalid = isvalid && validatableObject.value.toString().trim().length <= validatableObject.maxlength;
        }
    }
    if(typeof validatableObject.value === 'number') { //validamos para los números
        if(validatableObject.min != null) {
            isvalid = isvalid && validatableObject.value >= validatableObject.min;
        }
        if(validatableObject.max != null) {
            isvalid = isvalid && validatableObject.value <= validatableObject.max;
        }
    }
    return isvalid
}

function AutoBind(_:any, _2:string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    const ajdDescritor: PropertyDescriptor = {
        configurable: true,
        enumerable: false,
        get() {
            const boundFunction = method.bind(this);
            return boundFunction;
        }
    }
    console.log(ajdDescritor);
    console.log(descriptor)
    return ajdDescritor;
}

//las clases abstractas no se pueden instanciar
abstract class ProjectBaseClass<T extends HTMLElement,U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    element: U;

    constructor(templateId: string,hostId: string,  insertStart: boolean, newElementId?: string) {
        this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
        this.hostElement = document.getElementById(hostId)! as T;

        const importedContent = document.importNode(this.templateElement.content, true); //Accedemos a un nodo, que en este caso sería el template y pasamos true poque sí quremos recibir a todos sus hijos
        this.element = importedContent.firstElementChild as U; //acceder al primer hijo del template que en este caso sería el form
        
        if(newElementId) {
            this.element.id = newElementId;
        };

        this.attach(insertStart);
    }

    private attach(placeToInsert: boolean) {
        this.hostElement.insertAdjacentElement(placeToInsert ? 'afterbegin' : 'beforeend', this.element); //indicamos que queremos insetar un elemento, el cual sería el form
    }

    abstract configure(): void;
    abstract renderContent(): void; // al ser métodos abstractos indicamos qué deben ser implementados por la clase que hereda
}

class ProjectInput extends ProjectBaseClass<HTMLDivElement, HTMLFormElement> {
    titleInput: HTMLInputElement;
    descriptionInput: HTMLInputElement;
    peopleInput: HTMLInputElement;

    constructor() {
        super('project-input', 'app', true, 'user-input');

        this.titleInput = this.element.querySelector('#title') as HTMLInputElement;
        this.descriptionInput = this.element.querySelector('#description') as HTMLInputElement;
        this.peopleInput = this.element.querySelector('#people') as HTMLInputElement;
        this.configure();
    }

    configure() {
        this.element.addEventListener('submit', this.submitHandler) //al pasarle this, le eindicamos que el this interno hará referencia al context externo que es la clase y no el contexto dentro de la llamada
    }

    renderContent(){
        
    }
    private collectUserInput(): [string, string, number] | void {
        const enteredtitle = this.titleInput.value;
        const description = this.descriptionInput.value;
        const people = this.peopleInput.value;

        const objTitle = {value: enteredtitle, required: true, minlength: 6};
        const objDesc = {value: description, required: true, minlength: 5, maxlength: 20};
        const objPeople = {value: +people, required: true, min: 1, max: 5};
        //if(enteredtitle.trim().length === 0 || description.trim().length === 0 || people.trim().length === 0) {
        if(!ValidateData(objTitle) ||
           !ValidateData(objDesc) ||
           !ValidateData(objPeople)) {
            alert('Invalid Input, please try again');
            return;
        } else {
            return [enteredtitle, description, +people]
        }
    }
    @AutoBind
    private submitHandler(event: Event) { //this no va a funcionar de la misma forma, por lo que this no hace referencia a la clase y el bind  de se hace ahora desde el evento que lo llama
        event.preventDefault();
        const userInput = this.collectUserInput();
        if(Array.isArray(userInput)) { //if is an array (Tuples are arrays) returns true
            const [title, description, people] = userInput;
            projectState.addItem(title,description,people);
            this.clearInputs();
        }
    }

    private clearInputs() {
        this.titleInput.value = "";
        this.descriptionInput.value = "";
        this.peopleInput.value = "";

    }
}

class ListProjects extends ProjectBaseClass<HTMLDivElement, HTMLElement> implements DragTarget{
    assignedProjects: Project[]

    constructor(private type: 'active' | 'finished') {

        super('project-list', 'app', false,`${type}-projects` );
        this.assignedProjects = [];
        this.configure();
        this.renderContent();
    }

    @AutoBind
    dragOverHandler(event: DragEvent) {
        event.preventDefault();
        if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            const ListEl = this.element.querySelector('ul')!;
            ListEl.classList.add('droppable');
        }
    }

    @AutoBind
    dropHandler(event: DragEvent) {
        event.preventDefault();
        const id = event.dataTransfer!.getData('text/plain');
        
        projectState.moveProject(id, this.type === 'active'? Status.Active: Status.Finished);
    }

    @AutoBind
    dragLeaveHanlder(_: DragEvent) {
        const ListEl = this.element.querySelector('ul')!;
        ListEl.classList.remove('droppable');
    }

    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave',this.dragLeaveHanlder);
        this.element.addEventListener('drop', this.dropHandler);

        projectState.addListener((projects: Project[]) => {
            this.assignedProjects = projects.filter(project => project.status === this.type);
            this.renderProjects();
         });

    }

    renderContent () {
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toLocaleUpperCase() + ' PROJECTS';
    }

    private renderProjects() {
        const ListProjects = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
        ListProjects.innerHTML = '';
        for(const project of this.assignedProjects) {
            new ProjectItem(`${this.type}-projects-list`, project);
        }
    }   
}

class ProjectItem extends ProjectBaseClass<HTMLUListElement,HTMLLIElement> implements Draggable{
    headerItem: HTMLHeadingElement;
    paragraphItem: HTMLParagraphElement;
    peopleItem: HTMLHeadingElement

    constructor(listProject: string,private projectData: Project) {
        super('single-project', listProject, false, projectData.id);
        this.headerItem = document.createElement('h2');
        this.paragraphItem = document.createElement('p');
        this.peopleItem = document.createElement('h3');
        
        this.configure();
        this.renderContent();
    }

    @AutoBind
    dragStartHandler(event: DragEvent): void {
        event.dataTransfer!.setData('text/plain', this.projectData.id);
        event.dataTransfer!.effectAllowed = 'move'
    }

    dragEndHanlder(_: DragEvent): void {
        console.log('Drag Ended');
    }
    configure() {
        this.headerItem.textContent = this.projectData.title;
        this.paragraphItem.textContent = this.projectData.description;
        const person = this.projectData.people > 1 ? 'Persons': 'Person';
        this.peopleItem.textContent = `${this.projectData.people.toString()} ${person} Assigned`;

        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHanlder);
    }

    renderContent() {
        this.element.appendChild(this.headerItem);
        this.element.appendChild(this.paragraphItem);
        this.element.appendChild(this.peopleItem);
    }
}
const projectInpt = new ProjectInput();
const activeProjectList =  new ListProjects('active');
const finishedProjectList =  new ListProjects('finished');