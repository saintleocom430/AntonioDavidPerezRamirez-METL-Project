var Quizzes = (function(){
    var quizzes = {};
    var quizAnswers = {};
		var quizResultsGraphs = {};

    var currentQuiz = {};
		var unansweredQuizSummaryContainer = {};
		var unansweredQuizSummaryTemplate = {};
		var answeredQuizSummaryContainer = {};
		var answeredQuizSummaryTemplate = {};
		var currentQuizContainer = {};
		var currentQuizTemplate = {};
		
		var quizDatagrid = {};
		var editQuizTemplate = {};
		var answerQuizTemplate = {};
		var showResultsTemplate = {};
		var actionsButtonsTemplate = {};

		var reRenderQuizzes = function(){
				quizDatagrid.jsGrid("loadData");
				var sortObj = quizDatagrid.jsGrid("getSorting");
				if ("field" in sortObj){
						quizDatagrid.jsGrid("sort",sortObj);
				}
		};

		var urlForQuizImage = function(quizId){
			 return sprintf("/quizProxy/%s/%s",Conversations.getCurrentConversationJid(),quizId);
		};

    $(function(){
			quizDatagrid = $("#quizDatagrid");
			editQuizTemplate = quizDatagrid.find(".editQuizPopup").clone();
			answerQuizTemplate = quizDatagrid.find(".answerQuizPopup").clone();
			showResultsTemplate = quizDatagrid.find(".viewResultsPopup").clone();
			actionsButtonsTemplate = quizDatagrid.find(".actionsButtons").clone();
			quizDatagrid.empty();

			var DateField = function(config){
					jsGrid.Field.call(this,config);
			};
			DateField.prototype = new jsGrid.Field({
					sorter: function(a,b){
							return new Date(a) - new Date(b);
					},
					itemTemplate: function(i){
							return new Date(i).toLocaleString();
					},
					insertTemplate: function(i){return ""},
					editTemplate: function(i){return ""},
					insertValue: function(){return ""},
					editValue: function(){return ""}
			});
			jsGrid.fields.dateField = DateField;

			var gridFields = [
				{name:"question",type:"text",title:"Question",readOnly:true},
				{name:"optionCount",type:"number",title:"Options",readOnly:true},
				{
					name:"url",type:"text",title:"Image",readOnly:true,
					itemTemplate:function(url,quizSummary){
						if (url){
							return $("<img/>",{src:urlForQuizImage(quizSummary.id),style:"width:120px;height:90px"});
						} else {
							return $("<span/>");
						}
					}
				},
				{name:"created",type:"dateField",title:"Created",readOnly:true},
				{name:"timestamp",type:"dateField",title:"Modified",readOnly:true},
				{
					name:"answerCount",type:"number",title:"Answers",readOnly:true,
					itemTemplate:function(answerCount,quizSummary){
						if (Conversations.shouldModifyConversation()){
							var quiz = quizzes[quizSummary.key];
							var elem = $("<div/>");
							var quizResultsId = "quizResultsGraph_"+quiz.id;
							_.defer(function(){
								renderQuizResults("#"+quizResultsId,quiz,160,120);
							});
							var canvas = $("<canvas/>",{id:quizResultsId});
							elem.append(canvas);
							/*
							elem.append(quizResultsGraphs[quizSummary.key]);
							elem.css({
								width:"100%",
								height:"100%"
							});
							*/
							elem.on("click",function(){
								var resultsW = 640;
								var resultsH = 480;
								var resultsPopupTitle = sprintf("Results for %s",quiz.question);
								var popupId = sprintf("quizResultsPopup_%s",quiz.id);
								var resultsPopupContainer = $("<div/>",{id:popupId});
								var jAlert = $.jAlert({
									title:resultsPopupTitle,
									width:"auto",
									content:resultsPopupContainer[0].outerHTML	
								});
								var rootElem = showResultsTemplate.clone();
								var quizResultsPopupId = sprintf("quizResultsPopupGraph_%s",quiz.id);
								rootElem.find(".quizResultsGraph").attr("id",quizResultsPopupId);
								_.defer(function(){
									renderQuizResults("#"+quizResultsPopupId,quiz,resultsW,resultsH);
								});
								
								var quizImagePreview = rootElem.find(".quizImagePreview");
								quizImagePreview.attr("src",urlForQuizImage(quiz.id));
								if ("url" in quiz){
									quizImagePreview.show();
								} else {
									quizImagePreview.hide();
								}

								var answerContainer = rootElem.find(".quizOptionContainer");
								var answerTemplate = answerContainer.find(".quizOption");
						

								var theseQuizAnswerers = quizAnswersFunction(quiz);
								var quizOptionAnswerCount = function(quiz, qo){
										var count = 0;
										if (quiz.id in quizAnswers){
												$.each(theseQuizAnswerers,function(name,answerer){
														if (answerer.latestAnswer.answer.toLowerCase() == qo.name.toLowerCase() && (Conversations.shouldModifyConversation() || name.toLowerCase() == UserSettings.getUsername().toLowerCase())){
																count = count +1;
														}
												});
										};
										return count;
								}

								var totalAnswerCount = _.size(theseQuizAnswerers);
								var highWaterMark = totalAnswerCount * 0.5;
								var optimumMark = totalAnswerCount;
								var lowWaterMark = totalAnswerCount * 0.25;

								answerContainer.html(_.map(quiz.options,function(opt){
									var answer = answerTemplate.clone();
									answer.find(".quizOptionName").text(opt.name);
									answer.find(".quizOptionText").text(opt.text);
									var optionMeter = answer.find(".quizOptionMeter");
									if(Conversations.shouldModifyConversation()){
										var score = quizOptionAnswerCount(quiz,opt);
										answer.find(".quizOptionAnswerCount").text(score);
										optionMeter.attr("value",score).attr("min",0).attr("max",totalAnswerCount).attr("low",lowWaterMark).attr("high",highWaterMark).attr("optimum",optimumMark).text(sprintf("%s out of %s",score,totalAnswerCount));
									} else {
										answer.find(".quizOptionCountContainer").remove();
										optionMeter.remove();
									}
									return answer;
								}));

								var withQuizImage = function(afterFunc){
									var submissionQuality = 0.4;
									var quizCanvas = $("#"+quizResultsPopupId)[0];
									var tempCanvas = $("<canvas/>");
									var w = resultsW;
									var h = resultsH;
									tempCanvas.width = w;
									tempCanvas.height = h;
									tempCanvas.attr("width",w);
									tempCanvas.attr("height",h);
									tempCanvas.css({
										width:w,
										height:h
									});
									var ctx = tempCanvas[0].getContext("2d");
									ctx.fillStyle = "rgb(255,255,255)";
									ctx.fillRect(0,0,w,h);
									ctx.drawImage(quizCanvas,0,0,w,h);
									var imageData = tempCanvas[0].toDataURL("image/jpeg",submissionQuality);
									var t = new Date().getTime();
									var username = UserSettings.getUsername();
									var cc = Conversations.getCurrentConversation();
									var title = sprintf("quizresultsimage%s%s.jpg",username,t.toString());
									var identity = sprintf("%s:%s:%s",cc.jid.toString(),title,t);
									var url = sprintf("/uploadDataUri?jid=%s&filename=%s",cc.jid.toString(),encodeURI(identity));
									$.ajax({
										url: url,
										type: 'POST',
										success: function(e){
											var newIdentity = $(e).find("resourceUrl").text();
											afterFunc(newIdentity,tempCanvas,imageData);
										},
										error: function(e){
											console.log("exception while adding the quizResultsGraph to the slide",e);
										},
										data: imageData,
										cache: false,
										contentType: false,
										processData: false
									});
								};
								rootElem.find(".quizResultsShouldDisplayOnSlide").on("click",function(){
									withQuizImage(function(newIdentity,tempCanvas,imageData){
										var slideId = Conversations.getCurrentSlideJid();
										var username = UserSettings.getUsername();
										var t = new Date().getTime();
										var imageId = sprintf("%s%s%s",slideId,username,t);
										var newTag = imageId;
										var imageStanza = {
											type:"image",
											author:username,
											height:h,
											width:w,
											identity:imageId,
											slide:slideId,
											source:newIdentity,
											privacy:"PUBLIC",
											tag:newTag,
											target:"presentationSpace",
											timestamp:t,
											x:10,
											y:10
										};
										sendStanza(imageStanza);
										jAlert.closeAlert();
										hideBackstage();
									});
								});
								rootElem.find(".quizResultsShouldDisplayOnNextSlide").on("click",function(){
									withQuizImage(function(newIdentity,tempCanvas,imageData){
										var convJid = Conversations.getCurrentConversationJid();
										newIndex = Conversations.getCurrentSlide().index + 1;
										addImageSlideToConversationAtIndex(convJid,newIndex,newIdentity);
										jAlert.closeAlert();
										hideBackstage();
									});
								});

								$("#"+popupId).append(rootElem);
							});
							return elem;
						} else {
							return $("<span/>"); 
						}
					}																																																		 
				},
				{
					name:"id",type:"text",title:"Actions",readOnly:true,sorting:false,
					itemTemplate:function(id,quizSummary){
						var quiz = quizzes[quizSummary.key];
						var rootElem = actionsButtonsTemplate.clone();
						var editButton = rootElem.find(".editPollButton");
						var answerButton = rootElem.find(".answerPollButton");
						answerButton.on("click",function(){
							var answerTitle = sprintf("Answer poll: %s",quiz.question);
							var answerId = sprintf("quiz_answer_%s",quiz.id);
							var answerPopupContainer = $("<span/>",{id:answerId});
							var jAlert = $.jAlert({
								title:answerTitle,
								closeOnClick:true,
								width:"auto",
								content:answerPopupContainer[0].outerHTML
							});
							var answerContainerId = sprintf("answerContainer_%s",quiz.id);
							var answerPopup = answerQuizTemplate.clone();
							$("#"+answerId).append(answerPopup);
							answerPopup.find(".quizOptionCount").text(quizSummary.optionCount);
							answerPopup.find(".quizOptionCountPluralizer").text(quizSummary.optionCount == 1 ? "" : "s");
							var answerContainer = answerPopup.find(".quizOptionContainer");
							var answerTemplate = answerContainer.find(".quizOption").clone();
							answerContainer.html(_.map(quiz.options,function(opt){
								var answer = answerTemplate.clone();
								answer.find(".quizOptionButton").on("click",function(){
									console.log("answering:",quiz,opt);
									answerQuiz(Conversations.getCurrentConversationJid(),quiz.id,opt.name);
									jAlert.closeAlert();
								});
								answer.find(".quizOptionName").text(opt.name);
								answer.find(".quizOptionText").text(opt.text);
								return answer;	
							}));
							var quizImagePreview = answerPopup.find(".quizImagePreview");
							quizImagePreview.attr("src",urlForQuizImage(quiz.id));
							if ("url" in quiz){
								quizImagePreview.show();
							} else {
								quizImagePreview.hide();
							}
						});
						if (Conversations.shouldModifyConversation()){
							editButton.on("click",function(){
								editQuizDialog(quiz);
							});
						} else {
							editButton.remove();
						}
						return rootElem;						
					}
				}
			];
			quizDatagrid.jsGrid({
				width:"100%",
				height:"auto",
				inserting:false,
				editing:false,
				sorting:true,
				paging:true,
				noDataContent: "No polls",
				controller: {
					loadData: function(filter){
						var sorted = _.map(_.keys(quizzes),function(k){
							var v = quizzes[k];
							var answers = quizAnswers[k];
							quizResultsGraphs[k] = updateQuizGraph(v);
							return {
								key:k,
								question:v.question,
								author:v.author,
								created:v.created,
								id:v.id,
								answerCount:_.size(answers),
								answers:answers,
								timestamp:v.timestamp,
								url:v.url,
								optionCount:_.size(v.options),
								options:v.options
							};
						});
						if ("sortField" in filter){
							sorted = _.sortBy(sorted,function(sub){
								return sub[filter.sortField];
							});
							if ("sortOrder" in filter && filter.sortOrder == "desc"){
								sorted = _.reverse(sorted);
							}
						}
						return sorted;
					}
				},
				pageLoading:false,
				fields: gridFields	
			});
			quizDatagrid.jsGrid("sort",{
				field:"name",
				order:"desc"
			});
			reRenderQuizzes();
    });

		var editQuizDialog = function(quiz){
			var newQuiz = _.cloneDeep(quiz);
			var containerId = sprintf("edit_quiz_%s",quiz.id);
			var popupContainer = $("<span/>",{id:containerId});
			var editTitle = sprintf("Edit poll: %s",quiz.question);
			var jAlert = $.jAlert({
				title:editTitle,
				width:"90%",
				content:popupContainer[0].outerHTML
			});
			var editPopup = editQuizTemplate.clone();
			editPopup.find(".quizQuestion").val(quiz.question).on("change",function(){
				newQuiz.question = $(this).val();
			});

			var answerContainer = editPopup.find(".quizOptionContainer");
			var answerTemplate = answerContainer.find(".quizOption");
			var generateOptionButton = function(opt){
				var answer = answerTemplate.clone();
				answer.find(".quizOptionName").text(opt.name);
				answer.find(".quizOptionText").val(opt.text).on("change",function(){
					opt.text = $(this).val();
				});
				answer.find(".quizOptionDelete").on("click",function(){
					newQuiz.options = _.filter(newQuiz.options,function(o){return o.name != opt.name;});
					answer.remove();
				});
				return answer;
			};
			answerContainer.html(_.map(newQuiz.options,generateOptionButton));
			editPopup.find(".addOptionButton").on("click",function(){
				var lastHighestName = _.reverse(_.orderBy(newQuiz.options,"name"))[0].name;
				var key = lastHighestName;
				if (/^z+$/.test(key)) {
					// If all z's, replace all with a's
					key = key.replace(/z/g, 'a') + 'a';
				} else {
					// (take till last char) append with (increment last char)
					key = key.slice(0, -1) + String.fromCharCode(key.slice(-1).charCodeAt() + 1);
				}
				var newOption = {
					type:"quizOption",
					name:key,
					text:"",
					correct:false,
					color:["#ffffff",255]
				};
				console.log("creating new option:",newQuiz.options,newOption);
				newQuiz.options.push(newOption);
				var optionHtml = generateOptionButton(newOption);
				answerContainer.append(optionHtml);
				var newText = optionHtml.find(".quizOptionText")[0];
				newText.scrollIntoView();
				newText.focus();
			});
			var imagePreview = editPopup.find(".quizImagePreview");
			imagePreview.attr("src",urlForQuizImage(newQuiz.id));
			if ("url" in newQuiz){
				imagePreview.show();
			} else {
				imagePreview.hide();
			}
			var removeQuizButton = editPopup.find(".removeSlideImageFromQuiz");
			removeQuizButton.on("click",function(){
				imagePreview.attr("src",undefined).hide();
				removeQuizButton.hide();
				newQuiz.url = undefined;
			});
			if ("url" in newQuiz){
				removeQuizButton.show();
			} else {
				removeQuizButton.hide();
			};
			editPopup.find(".addSlideImageToQuiz").on("click",function(){
				WorkQueue.pause();
				var cc = Conversations.getCurrentConversation();

				var submissionQuality = 0.4;
				var tempCanvas = $("<canvas />");
				var w = board[0].width;
				var h = board[0].height;
				tempCanvas.width = w;
				tempCanvas.height = h;
				tempCanvas.attr("width",w);
				tempCanvas.attr("height",h);
				tempCanvas.css({
					width:w,
					height:h
				});
				var tempCtx = tempCanvas[0].getContext("2d");
				tempCtx.fillStyle = "white";
				tempCtx.fillRect(0,0,w,h);
				tempCtx.drawImage(board[0],0,0,w,h);
				var imageData = tempCanvas[0].toDataURL("image/jpeg",submissionQuality);
				var t = new Date().getTime();
				var username = UserSettings.getUsername();
				var title = sprintf("quizimage%s%s.jpg",username,t.toString());
				var identity = sprintf("%s:%s:%s",cc.jid.toString(),title,t);
				var url = sprintf("/uploadDataUri?jid=%s&filename=%s",cc.jid.toString(),encodeURI(identity));
				$.ajax({
					url: url,
					type: 'POST',
					success: function(e){
						var newIdentity = $(e).find("resourceUrl").text();
						newQuiz.url = newIdentity;
						imagePreview.attr("src",imageData).show();
						removeQuizButton.show();
						WorkQueue.gracefullyResume();
						console.log("created new Image:",newIdentity);
					},
					error: function(e){
						console.log("exception while snapshotting the slide for the quizImage",e);
						WorkQueue.gracefullyResume();
					},
					data: imageData,
					cache: false,
					contentType: false,
					processData: false
				});
			});
			editPopup.find(".updateQuiz").on("click",function(){
				sendStanza(newQuiz);
				jAlert.closeAlert();
			});
			editPopup.find(".deleteQuiz").on("click",function(){
				newQuiz.deleted = true;
				sendStanza(newQuiz);
				jAlert.closeAlert();
			});

			$("#"+containerId).append(editPopup);
		};

		var clearState = function(){
        quizzes = {};
        quizAnswers = {};
        if (Conversations.shouldModifyConversation()){
					$("#quizCreationButton").unbind("click").on("click",function(){
						var t = new Date().getTime();
						var username = UserSettings.getUsername();
						var id = sprintf("%s_%s",username,t);
						var newQuiz = {
							type:"quiz",
							options:[
								{
									type:"quizOption",
									name:"A",
									text:"",
									correct:false,
									color:["#000000",255]
								},
								{
									type:"quizOption",
									name:"B",
									text:"",
									correct:false,
									color:["#000000",255]
								},
								{
									type:"quizOption",
									name:"C",
									text:"",
									correct:false,
									color:["#000000",255]
								}
							],
							question:"",
							author:username,
							created:t,
							id:id,
							isDeleted:false,
							timestamp:t,
							audiences:[]
						};
						editQuizDialog(newQuiz);
					}).show();
				} else {
					$("#quizCreationButton").unbind("click").hide();
				}
    };
    var renderQuizzesInPlace = function(){
			reRenderQuizzes();
    };
    var quizAnswersFunction = function(quiz){
        if ("type" in quiz && quiz.type == "quiz" && "id" in quiz){
            var quizId = quiz.id;
            var theseQuizAnswers = quizAnswers[quizId] || [];
            var theseQuizAnswerers = {};
            $.each(theseQuizAnswers,function(i,qra){
                if (Conversations.shouldModifyConversation() || qra.author.toLowerCase() == UserSettings.getUsername().toLowerCase()){
                    var previousAnswer = theseQuizAnswerers[qra.answerer] || {answerCount:0};
                    theseQuizAnswerers[qra.answerer] = {latestAnswer:qra,answerCount:previousAnswer.answerCount + 1};
                }
            });
            return theseQuizAnswerers;
        } else {
            return {};
        }
    };
		var generateQuizResultsGraph = function(quiz,w,h){
			var theseQuizAnswerers = quizAnswersFunction(quiz);
			var quizOptionAnswerCount = function(quiz, qo){
					var count = 0;
					if (quiz.id in quizAnswers){
							$.each(theseQuizAnswerers,function(name,answerer){
									if (answerer.latestAnswer.answer.toLowerCase() == qo.name.toLowerCase() && (Conversations.shouldModifyConversation() || name.toLowerCase() == UserSettings.getUsername().toLowerCase())){
											count = count +1;
									}
							});
					};
					return count;
			}
			var scorePerAnswer = _.map(quiz.options,function(opt){
				return quizOptionAnswerCount(quiz,opt);
			});
			
			var elem = $("<svg/>");
			var svg = d3.select(elem[0]);
			svg.attr("width",w).attr("height",h);
			var dcW = w - 20;
			var dcH = h - 20;
			var barWidth =  dcW / _.size(quiz.options);
			var scoreValue = dcH / _.max(scorePerAnswer);
			console.log("scorePerAnswer:",scorePerAnswer);
			var bars = svg.selectAll("rect").data(scorePerAnswer).enter().append("rect")
				.attr("x",function(d,i){
					return i * barWidth;
				})
				.attr("y",function(d,i){
					return dcH - (d * scoreValue);
				})
				.attr("height",function(d,i){
					return d * scoreValue;
				})
				.attr("width",function(d,i){
					return barWidth;
				})
				.style("fill","blue")
				.style("opacity","1.0")
				.style("stroke-width","1")
				.style("stroke","black");
			return elem;
		};
		var updateQuizGraph = function(quiz){
			quizResultsGraphs[quiz.id] = generateQuizResultsGraph(quiz,640,480);
		};
		var withSvgDataUrl = function(svg,afterFunc){
			try {
				var s = $(svg);
				var w = s.width();
				var h = s.height();
				var svgData = new XMLSerializer().serializeToString(svg);
				var blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
				var blobUrl = s.URL.createObjectURL(blob);
				$("<img />").width(w).height(h).on("load",function(){
					var canvas = $("<canvas/>");
					canvas.width = w;
					canvas.height = h;
					canvas.attr("width",w);
					canvas.attr("height",h);
					canvas.css({
						width:w,
						height:h
					});
					var ctx = canvas[0].getContext("2d");
					ctx.fillStyle = "rgb(255,255,255)";
					ctx.fillRect(0,0,w,h);
					ctx.drawImage(this,0,0,w,h);
					var submissionQuality = 0.4;
					var imageData = tempCanvas[0].toDataURL("image/jpeg",submissionQuality);
					afterFunc(imageData);
				}).attr("src",blobUrl);
			} catch(e) {
				console.log("exception while converting svg to dataUrl",e);
			}
		};
    var renderQuizResults = function(selector,quiz,w,h){
				var graph = $(selector);
				graph.width = w;
				graph.height = h;
				graph.attr("width",w);
				graph.attr("height",h);
				graph.css({
					width:w,
					height:h
				});
        var quizOptionAnswerCount = function(quiz, qo){
            var count = 0;
            if (quiz.id in quizAnswers){
                $.each(theseQuizAnswerers,function(name,answerer){
                    if (answerer.latestAnswer.answer.toLowerCase() == qo.name.toLowerCase() && (Conversations.shouldModifyConversation() || name.toLowerCase() == UserSettings.getUsername().toLowerCase())){
                        count = count +1;
                    }
                });
            };
            return count;
        }
        var theseQuizAnswerers = quizAnswersFunction(quiz);
				var options = {
					scales: {
						yAxes: [{
							stacked: true,
							ticks:{
							}
						}],
						xAxes: [{
							type: "linear",
							position: "bottom",
							ticks : {
								stepSize:1
							}	
						}]
					},
					legend:{
						display:false
					}
				}
				var splitLines = function(text,lineLength){
					return _.map(_.chunk(text.split(""),lineLength),function(line){return _.join(line,"");}); 		
				};
				var data = {
					labels:_.map(quiz.options,"name"),
					datasets:[{
						data:quiz.options.map(function(qo){
							return quizOptionAnswerCount(quiz,qo);
						}),
						borderColor:["black"],
						backgroundColor:["gray"],
						borderWidth:1
					}]
				}
				var chartDesc = {
					type: "horizontalBar",
					data: data,
					options: options	
				};
				var ctx = graph[0].getContext("2d");
				new Chart(ctx,chartDesc);
		}
    var actOnQuiz = function(newQuiz){
        quizzes[newQuiz.id] = newQuiz;
    };
    var actOnQuizResponse = function(answer){
        var items = quizAnswers[answer.id];
        if (items){
            items[_.size(items)] = answer;
        } else {
            items = [answer];
        }
        quizAnswers[answer.id] = items;
				if (answer.id in quizzes){
					updateQuizGraph(quizzes[answer.id]);
				}
    };
    var historyReceivedFunction = function(history){
        try {
            if ("type" in history && history.type == "history"){
                clearState();
                _.forEach(history.quizResponses,doStanzaReceivedFunction);
                _.forEach(history.quizzes,doStanzaReceivedFunction);
                renderQuizzesInPlace();
            }
        }
        catch (e){
            console.log("Quizzes.historyReceivedFunction",e);
        }
    };
    var stanzaReceivedFunction = function(input){
        doStanzaReceivedFunction(input);
        renderQuizzesInPlace();
    };
    var doStanzaReceivedFunction = function(possibleQuiz){
        try {
            if ("type" in possibleQuiz && possibleQuiz.type == "quizResponse"){
                actOnQuizResponse(possibleQuiz);
            } else if ("type" in possibleQuiz && possibleQuiz.type == "quiz"){
                actOnQuiz(possibleQuiz);
                if (currentQuiz.id == possibleQuiz.id){
                    currentQuiz = possibleQuiz;
                }
            }
        }
        catch(e){
            console.log("Quizzes.stanzaReceivedFunction exception",e);
        }
    };
    var receiveQuizzesFromLiftFunction = function(newQuizzes){
        try{
            if (_.size(newQuizzes) > 0){
                $.each(newQuizzes,function(unusedQuizName,quiz){
                    if ("type" in quiz && quiz.type == "quiz"){
                        quizzes[quiz.id] = quiz;
												updateQuizGraph(quiz);
                    }
                });
            }
            renderQuizzesInPlace();
        }
        catch(e){
            console.log("Quizzes.receiveQuizzesFromLift exception",e);
        }
    };
    var receiveQuizResponsesFromLiftFunction = function(answers){
        try {
            if (_.size(answers) > 0){
                var firstAnswer = answers[0];
                quizAnswers[firstAnswer.id] = answers;
                renderQuizzesInPlace();
            }
        }
        catch(e){
            console.log("Quizzes.receiveQuizResponsesFromLift exception",e);
        }
    };
    var updateQuizFunction = function(quizId,newQuiz){
        var oldQuiz = _.find(quizzes,function(i){return i.id == quizId;});
        if (Conversations.shouldModifyConversation()){
            sendStanza(newQuiz);
        }
    };
    var createQuizFunction = function(newQuiz){
        if (Conversations.shouldModifyConversation()){
            sendStanza(newQuiz);
        }
    };
    Progress.onConversationJoin["Quizzes"] = clearState;
    Progress.historyReceived["Quizzes"] = historyReceivedFunction;
    Progress.stanzaReceived["Quizzes"] = stanzaReceivedFunction;
    return {
        getCurrentQuiz:function(){return currentQuiz;},
        getAllQuizzes:function(){return quizzes;},
        getAnswersForQuiz:quizAnswersFunction,
				reRender:reRenderQuizzes	
    };
})();

//from Lift
//getQuizzesForConversation(conversationJid)
//answerQuiz(conversationJid,quizId,answer)
//createQuiz(conversationJid,newQuiz)
//updateQuiz(conversationJid,quizId,updatedQuiz)
