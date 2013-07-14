/**
 * User: miky petrescu
 * Date: 14/07/13
 * Time: 23:00
 */
(function($) {

    $.fn.gridPanel = function() {

        return this.each( function() {
            Layout($(this));
        });

        function Layout($grid){
            if($grid.css('position')=='static')
                $grid.css('position','relative');   //since we position our children in absolute
            var rowsDefinitions=['*']; //default
            if($grid.attr('row-definitions')!==undefined)
            {
                rowsDefinitions=$grid.attr('row-definitions').split(',');
                rowsDefinitions= $.map(rowsDefinitions,function(val,i){
                    return $.trim(val.toLowerCase());
                });

            }
            var columnsDefinitions=['*']; //default
            if($grid.attr('column-definitions')!==undefined)
            {
                columnsDefinitions=$grid.attr('column-definitions').split(',');
                columnsDefinitions= $.map(columnsDefinitions,function(val,i){
                    return $.trim(val.toLowerCase());
                });
            }


            var childElements=$grid.children("[grid-row],[grid-column]");
            var validChildElements=[];

            var rowsMaxValues={};
            var columnsMaxValues={};
            var childRowValidated, childColumnValidated=false;

            //gets a child

            //read dimensions
            for(var e=0;e<childElements.length;e++){
                var $currentChild=$(childElements[e]);

                //Read column widths
                var childColumn=$currentChild.attr('grid-column');
                if(childColumn===undefined)
                    childColumn=0;
                childRowValidated=readMaxValue($currentChild,childColumn,'column',columnsDefinitions,columnsMaxValues);
                if(childRowValidated)
                {
                    validChildElements.push($currentChild);
                }

                //Read row heights
                var childRow=$currentChild.attr('grid-row');
                if(childRow===undefined)
                    childRow=0;
                childColumnValidated=readMaxValue($currentChild,childRow,'row',rowsDefinitions,rowsMaxValues);
                if(childColumnValidated && !childRowValidated)
                {
                    validChildElements.push($currentChild);
                }

            }
            calcStarsAndSoftAutoDefinitions('column',columnsDefinitions,columnsMaxValues);
            calcStarsAndSoftAutoDefinitions('row',rowsDefinitions,rowsMaxValues);
            //set positions
            var absolute= true;//isAbsolute(grid);
            setPosition($grid,validChildElements,'row',rowsMaxValues,rowsDefinitions,false);
            setPosition($grid,validChildElements,'column',columnsMaxValues,columnsDefinitions,true);
        }

        function getTopPosition(maxValues, row) {
            var sum=0;

            for(var i=0;i<row;i++){
                if(maxValues['row-'+i])
                    sum+=maxValues['row-'+i];
            }

            return sum;
        }

        function getLeftPosition(maxValues,valueIndex){
            var sum=0;
            for(var i=0;i<valueIndex;i++){
                if(maxValues['column-' + i])
                    sum+=maxValues['column-' + i];
            }
            return sum;
        }

        function getRightPosition(maxValues,valueIndex,span){
            var sum=0;
            for(var i=0;i<valueIndex;i++){
                sum+=maxValues['column-' + i];
            }
            return sum;
        }

        function calcStarsAndSoftAutoDefinitions (valueType, definitions, maxValues) {
            for(var i=0;i<definitions.length;i++){
                if(definitions[i].indexOf('*')!=-1)
                {
                    var stars=parseInt(definitions[i])||1;

                    if(!maxValues[valueType + '-' + '*'])
                        maxValues[valueType + '-' + '*']=stars;
                    else
                        maxValues[valueType + '-' + '*']+=stars;
                }
                if(definitions[i]=='~auto'){
                    if(!maxValues[valueType + '-' + '~auto'])
                        maxValues[valueType + '-' + '~auto']=1;
                    else
                        maxValues[valueType + '-' + '~auto']++;
                }
            }
        };

        function setPosition($grid,elements,positionType,maxValues,definitions,triggerPositionEvent){
            var fixedElementsValue=getFixedElementsValue(positionType, maxValues,definitions,false);
            var gridValue=getAbsoluteValue(positionType,$grid);
            var starValue=0;
            if(maxValues[positionType + '-~auto']>0){
                 setSoftAutoElementsValues(positionType,maxValues,definitions,gridValue-fixedElementsValue);
            }
            if(maxValues[positionType + '-*']>0)
            {
                var fixedAndSoftAutoElementsValue=getFixedElementsValue(positionType,maxValues,definitions,true);
                if(gridValue-fixedAndSoftAutoElementsValue>0)
                {
                    starValue=Math.round((gridValue-fixedAndSoftAutoElementsValue)/maxValues[positionType + '-*']);
                }
                setStarElementsValues(positionType,maxValues,definitions, gridValue-fixedAndSoftAutoElementsValue,starValue);
            }


            for(var e=0;e<elements.length;e++){
                var $currentChild=elements[e];
                setAbsolutePosition($currentChild,$grid,positionType,maxValues);
                if(triggerPositionEvent)
                {
                    $grid.trigger('gp-item-positioned',[$grid,$currentChild]);
                }
            }
        }
        function setAbsolutePosition($element,$parent,positionType,maxValues){
            var childIndex=parseInt($element.attr('grid-' + positionType))||0;

            if(positionType=='row'){
                var parentHeight=getAbsoluteValue(positionType,$parent);
                var rowSpan=parseInt($element.attr('grid-row-span'))||1
                rowSpan--;
                var marginTop=parseInt($element.css('marginTop'))||0;
                var marginBottom=parseInt($element.css('marginBottom'))||0;
                var currentTop=getTopPosition(maxValues,childIndex);
                var currentBottom=parentHeight- getTopPosition(maxValues,childIndex+rowSpan+1) + marginBottom;
                var height=parentHeight-currentBottom-currentTop-marginTop-marginBottom;
                $element.height(height);
                $element.css({
                    "position":"absolute",
                    "top": currentTop + "px",
                    "bottom": currentBottom + "px"
                }) ;
            }
            if(positionType=='column'){
                var parentWidth=getAbsoluteValue(positionType,$parent);
                var columnSpan=parseInt($element.attr('grid-column-span'))||1
                columnSpan--;
                var marginLeft=parseInt($element.css('marginLeft'))||0;
                var marginRight=parseInt($element.css('marginRight'))||0;
                var currentLeft=getLeftPosition(maxValues,childIndex) + marginLeft;

                var currentRight=parentWidth-getLeftPosition(maxValues,childIndex+columnSpan+1) +marginRight;
                var width=parentWidth - currentRight - currentLeft -marginRight -marginLeft;

                $element.width(width);
                $element.css({
                    "position":"absolute",
                    "left" :  currentLeft + "px",
                    "right":  currentRight + "px"
                })
            }
        }

        //returns Height/Width of the element
        function getAbsoluteValue(valueType,$element){
            if(valueType=='row')
                return $element.height();
            else if(valueType=='column')
                return $element.width();
        }
        //return ScrollHeight/ScrollWidth of the element (requestedValue)
        function getValue(valueType,$element){
            if(valueType=='row')
            {
                $element.height('auto');
                $element.css('bottom',"");
                return $element.prop('scrollHeight');
            }
            else if(valueType=='column')
            {
                $element.width('auto');
                $element.css('right',"");
                return $element.prop('scrollWidth');
            }
        }
        function readMaxValue ($childElement,index,valueType,definitions,maxValues){
            if(index>=0 && index<definitions.length){
                var definition=definitions[index];
                //first loop should skip stars because we don't know how much space we have left
                if(definition.indexOf('*')>-1){

                }
                else if(definition=='auto' || definition=='~auto'){
                    var value=getValue(valueType,$childElement);
                    //if the dict slot is undefined or less than current height set a new max height
                    if(!maxValues[valueType + '-' + index] || maxValues[valueType + '-' + index]<value){
                        maxValues[valueType + '-' + index]=value;
                    }
                }
                else{ //it's a fixed value
                    maxValues[valueType + '-' + index]=parseInt(definition); //save the fixed height;
                }
                return true; //is valid
            }
            return false; //not valid child
        }

        function setSoftAutoElementsValues(valueType,maxValues, definitions,gridValue) {
            for(var i=0;i<definitions.length;i++){
                //if(autoMaxHeights[i]=='*') continue;
                if(definitions[i]=='~auto')
                {
                    var requiredValue=maxValues[valueType + '-' + i];
                    if(gridValue-requiredValue<0)
                    {
                        maxValues[valueType + '-' + i]=gridValue;
                    }
                    gridValue-=maxValues[valueType + '-' + i];
                }
            }
        }

        function setStarElementsValues  (valueType,maxValues, definitions,gridHeight,starHeight) {
            var lastStarElement=-1;
            for(var i=0;i<definitions.length;i++){
                //if(autoMaxHeights[i]=='*') continue;
                if(definitions[i].indexOf('*')!=-1)
                {
                    var stars=parseInt(definitions[i])||1;
                    maxValues[valueType + '-' + i]=starHeight * stars;
                    gridHeight-=(starHeight*stars);
                    lastStarElement=i;
                }
            }
            maxValues[valueType + '-' + lastStarElement]+=gridHeight; //add the reminder of the division

        };
        function getFixedElementsValue(valueType,maxValues, definitions,includeSoftAuto) {
            var sum=0;
            for(var i=0;i<definitions.length;i++){
                if(!(maxValues[valueType + '-' + i])) continue; //there's no element value for this definition
                if(includeSoftAuto==false){
                    if(definitions[i].indexOf('*')==-1 && definitions[i]!='~auto'){
                        sum+=maxValues[valueType + '-' + i];
                    }
                }
                else{
                    if(definitions[i].indexOf('*')==-1){
                        sum+=maxValues[valueType + '-' + i];
                    }
                }
            }
            return sum;
        };
    }

}(jQuery));