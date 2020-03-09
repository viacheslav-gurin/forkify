import axios from 'axios';
import { proxy } from '../config';

export default class Recipe {
    constructor(id) {
        this.id = id;
    }

    async getRecipe() {
        try {
            const res = await axios(`${proxy}https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);
            this.title = res.data.recipe.title;
            this.author = res.data.recipe.publisher;
            this.img = res.data.recipe.image_url;
            this.url = res.data.recipe.source_url;
            this.ingredients = res.data.recipe.ingredients;
        } catch(error) {
            console.log(error);
            alert('Something went wrong');
        }
    }

    calcTime() {
        // Assuming that we need 15 min for each 3 ingredients
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng / 3);
        this.time = periods * 15;
    }

    calcServings() {
        this.servings = 4;
    }

    parseIngredients() {

        const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
        const units = [...unitsShort, 'kg', 'g'];

        const newIngredients = this.ingredients.map(el => {
            
            // 1. Uniform units (привести единицы измерения ингредиентов к единообразию)
            let ingredient = el.toLowerCase();
            unitsLong.forEach((unit, i) => {
                ingredient = ingredient.replace(unit, unitsShort[i]); 
            });

            // 2. Remove parentheses (удалить содержимое в скобках вместе с самими скобками)
            ingredient = ingredient.replace(/ *\([^)]*\) */g, ' '); // regular expressions

            // 3. Parse ingredients into count, unit and ingredient
            const arrIng = ingredient.split(' '); // сплитим строку, описывающую ингредиент, по пробелу
            const unitIndex = arrIng.findIndex(el2 => units.includes(el2)); // находим индекс юнита ингредиента

            let objIng;
            if (unitIndex > -1) {
                // There is a unit
                // Example: 4 1/2 cups, arrCount is [4, 1/2]
                // Example: 4 cups, Arrcoune is [4]
                const arrCount = arrIng.slice(0, unitIndex); // слайсим из массива все, что предшествует юниту ингредиента

                let count;
                if (arrCount.length === 1) { // если до юнита всего 1 знак/символ (а стало быть и размерность массива arrCount равна единице!)
                    count = eval(arrIng[0].replace('-', '+')); // то в счетчик мер складываем естественно только самый первый (нулевой) элемент массива; этот элемент и есть количество юнитов конкретного ингредиента для приготовления блюда. Отдельно про replace в этом случае: в данных с сервака попадаются случаи, когда количество ингредиента указано как, например, "1-1/3 cups", где '-' в реальности означает '+', поэтому, чтобы покрыть и этот случай, нам надо заменить минус на плюс.
                } else { // в противном случае (т.е. когда размерность массива > 1) мы должны объединить две строки (например, "4" и "1/2" из примера выше)
                    count = eval(arrIng.slice(0, unitIndex).join('+')); // в результате count будет равен следующему: [4, 1/2] --> ("4+1/2") --> eval("4+1/2") = 4.5
                }
                objIng = {
                    count,
                    unit: arrIng[unitIndex],
                    ingredient: arrIng.slice(unitIndex + 1).join(' ')
                };
            
            } else if (parseInt(arrIng[0], 10)) {
                // There is NO unit, but the 1st element is a number
                objIng = {
                    count: parseInt(arrIng[0], 10),
                    unit: '',
                    ingredient: arrIng.slice(1).join(' ') 
                }
            } else if (unitIndex === -1) {
                // There is NO unit and NO number in 1st position
                objIng = {
                    count: 1,
                    unit: '',
                    ingredient
                }
            }
            
            return objIng;
        });
        this.ingredients = newIngredients;
    }

    updateServings(type) {
        // Servings
        const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;

        // Ingredients
        this.ingredients.forEach(ing => {
            ing.count *= (newServings / this.servings);
        });

        this.servings = newServings;
    }
}

