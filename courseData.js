/*eslint-env node*/
/*eslint no-console:0*/
/*global valence*/
//mainish
valence.run(function (err, data) {
    console.log("data:", data);
    console.log("categories:", data.getCategories());
    console.log("grades:", data.getGrades());

    //error check and handle
    if (err) {
        return console.log("Error: " + err);
    } else {
        //start building

        //test course object
        var testCourse = {};

        //overall object and units array
        makeOverallObj(testCourse, data);
        makeUnitsArray(testCourse, data);

        console.log("Test course:", testCourse);
    }

});

/**********************************************************
 * function: makeOverallObj
 * desc: Makes overall object using values from the final 
 *       grade object.
 * inputs: 
 *       testCourse: object
 *       data: object from valence
 * outputs: none
 **********************************************************/
function makeOverallObj(testCourse, data) {

    //make overall variables
    var op = data.getFinalCalculatedGrade().pointsDenominator;

    var oe = data.getFinalCalculatedGrade().pointsNumerator;

    var passingGradePercentage = .7;

    //set test courses overall with variables
    testCourse.overall = {
        "overallPossible": op,
        "overallEarned": oe,
        "passingValue": passingGradePercentage * op
    };
}

/**********************************************************
 * function: makeUnitsArray
 * desc: Makes an array of arrays where each subarray holds 
 *       unit info and makes ar array of unit objects.
 * inputs: 
 *       testCourse: object
 *       data: object from valence
 * outputs: none
 **********************************************************/
function makeUnitsArray(testCourse, data) {

    var categories = data.getCategories(); 
    var unitCats = [];
    
    
    for (var i = 0; i < 3; i++) {
        unitCats.push(categories.filter(function(cat) {
            return cat.shortName.substr(1, 1) === ((i + 1) + "");
        }));
    }

    //make unit array
    var unitObjs = [];
    for (i = 0; i < unitCats.length; i++) {
        unitObjs.push(makeUnitObj(data, unitCats[i]));
    }
    
    console.log("unit objs: " + unitObjs);

    //set test courses units with made unit array
    testCourse.units = unitObjs;

}

/**********************************************************
 * function: makeUnitObj
 * desc: Sums up the possible points and the earned points 
 *       then makes an array of day objects.
 * inputs: 
 *       category: category object
 *       days: array of category objects last one is section 
 * outputs: unit object
 **********************************************************/
function makeUnitObj(data, days) {
    
    //make dayObjs array
    var dayObjs = [];
    for (var i = 0; i < days.length - 1; i++) {
        dayObjs.push(makeDayObj(data, days[i]));
    }
    
    console.log("dayObjs:", dayObjs);
    console.log("de:", dayObjs[0].dayEarned);
    console.log("dp:", dayObjs[0].dayPossible);
    
    //sums up total unit points (including overall section)
    var sumsTemplate = {unitEarned: 0, unitPoss: 0};
    var sums = dayObjs.reduce(function(totals, day) {     
      
        totals.unitEarned += day.dayEarned;
        totals.unitPoss += day.dayPossible;
        
        return totals;
        
    }, sumsTemplate);
    
    //make unit object
    return {
        "title": days[days.length - 1].catName,
        "earnedBadge": false,
        "unitPossible": sums.unitPoss,
        "unitEarned": sums.unitEarned, 
        "days": dayObjs
    };
}

/**********************************************************
 * function: makeDayObj
 * desc: Sums up preperations possible points and preperations 
 *       earned points then uses subtraction to find electives 
 *       points.
 * inputs: 
 *       dayCat: category object
 * outputs: day object
 **********************************************************/
function makeDayObj(data, dayCat) {

    //make grades array
    var grades = data.getGrades();
    
    //determine values for prepEarned, prepPoss, totalEarned, and totalPoss 
    var sumsTemplate = {prepEarned: 0, prepPoss: 0, totalEarned: 0, totalPoss: 0};
    var sums = grades.reduce(function(totals, grade) {     
        if (grade.catID === dayCat.catID) {
            totals.totalEarned += grade.pointsNumerator;
            totals.totalPoss += grade.maxPoints;
        }  
        if (grade.catID === dayCat.catID && grade.gradeShortName === "p") {
            totals.prepEarned += grade.pointsNumerator;
            totals.prepPoss += grade.maxPoints;
        }
        return totals;
    }, sumsTemplate);
  
    //determine values for electiveEarned and electivePoss
    var electiveEarned = sums.totalEarned - sums.prepEarned;
    var electivePoss = sums.totalPoss - sums.prepPoss;
     
    //make day object
    return {
        "title": dayCat.catName,
        "prep": {
            "earned": sums.prepEarned,
            "possible": sums.prepPoss
        },
        "elective": {
            "earned": electiveEarned,
            "possible": electivePoss
        },
        "badge": false,
        "dayPossible": sums.totalPoss,
        "dayEarned": sums.totalEarned
    };
}