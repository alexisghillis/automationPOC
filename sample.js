var apps = [],
    matrix = [],
    api = [];
phantom.casperTest = true;
var fs = require('fs');
var utils = require('utils');
var x = require('casper').selectXPath;
var tStamp = new Date().getTime();
var DelXPath = '';
casper.options.viewportSize = {
    width: 1680,
    height: 910
};
var data = fs.open('properties.txt', 'r');
var c, line;


for (c = 0; c < casper.cli.get('env'); c++)
    line = data.readLine();
data.close();

var array = line.split("|");

var credentials = array[2].split(";");
var URL = array[1];
var GTW = array[3];
var GTW_NO = array[4];
var env_ = array[5];
var TOKEN_ACCESS = array[6];
var timeBefore, timeAfter,howMuchTime;


//-------------------option to see for each request and response header
// casper.options.onResourceRequested = function(C, requestData, request) {
//     utils.dump(requestData.headers);
// };
// casper.options.onResourceReceived = function(C, response) {
//     utils.dump(response.headers);
// };
casper.start();

function marsLogIn(role) {

    timeBefore = new Date().getTime();

    var user_roles, USER, PASS;
    if (role === "publisher") {
        user_roles = credentials[0].split(",");
        USER = user_roles[0];
        PASS = user_roles[1];
    } else {
        user_roles = credentials[1].split(",");
        USER = user_roles[0];
        PASS = user_roles[1];
    }

    casper.open(URL).waitForText("Please Sign In", function found() {
        this.echo("==========================================");
        this.echo("LOGIN with user: "+role);
        this.echo("==========================================");
        this.echo('Login Page Found');
        this.test.pass('Login page shown');
    },function notfound(){
        this.test.fail('Login page not shown');
    },10000);

    casper.then(function() {
        this.echo("Credentials are: " + USER + ", " + PASS);
        this.fill('form[action="/wso2-api-wrapper/login.do"]', {
            username: USER,
            password: PASS
        }, true);

        this.waitForText('METRO API Repository', function success() {
            this.test.pass('Logged in success');
            timeAfter = new Date().getTime();
            howMuchTime = timeAfter-timeBefore;
            fs.write("time.txt", new Date().toISOString() + '|' + marsLogIn.name + '|' + howMuchTime + '\n', 'a');
        }, function fail() {
            this.test.fail('Logged in failed');
        }, 10000);
    });

}
//marsLogIn

function deleteApplication() {
    casper.then(function() {
        this.echo("==========================================");
        this.echo("DELETE APPLICATION");
        this.echo("==========================================");
    });
    casper.thenClick('a[href="applications"]', function() {
        this.echo("Clicked My Application");
    });

    casper.then(function() {
        apps = apps.concat(this.evaluate(function() {
            var aTag = document.getElementsByTagName('td');
            return Array.prototype.map.call(aTag, function(e) {
                return e.textContent;
            });
        }));

        var contor = 1,
            i = 0;
        while (i < apps.length) {
            matrix[contor] = [];
            matrix[contor][1] = apps[i];
            matrix[contor][2] = apps[i + 1];
            matrix[contor][3] = apps[i + 2];
            matrix[contor][4] = apps[i + 3];
            i = i + 4;
            contor++;
        }
        var onlyApp = []
        for (var p = 1; p < contor; p++) {
            onlyApp[p] = matrix[p][1];
        }

        this.echo('Filtering applications');
        for (var c = 0; c <= contor; c++) {
            this.echo(onlyApp[c]);
            if (onlyApp[c] == "Auto_" + tStamp) {
                this.echo('Application found on line: ' + c + '\n');
                DelXPath = "//*[@id='applicationTable']/tbody/tr[" + c + "]/td[4]/a";
                this.echo(DelXPath);
                break;
            }

        }

        this.test.assertExists({
            type: 'xpath',
            path: DelXPath
        }, "Application delete button found");

        this.thenClick(x(DelXPath), function() {
            this.echo("Pressed the Delete button");
        });


    });

    casper.then(function() {
        this.test.assertExists({
            type: 'xpath',
            path: 'html/body/div[2]/div[2]/div/div[3]/button[1]'
        }, "Deletation confirmation button found");

        this.thenClick(x('html/body/div[2]/div[2]/div/div[3]/button[1]'), function() {
            this.echo("Pressed Yes in the modal confirmation");
        });

        this.waitForText("Success", function() {
            this.echo('Deleted with success modal appears');
        });
        this.test.assertExists({
            type: 'xpath',
            path: 'html/body/div[2]/div[2]/div/div[3]/button'
        }, "Delete success confirmation button found");

        this.thenClick(x('html/body/div[2]/div[2]/div/div[3]/button'), function() {
            this.echo("Application should be deleted");
        });

        this.wait(2000, function() {
            this.waitForText(tStamp, function() {
                this.echo('Application not deleted');
            }, function() {
                this.echo('Application deleted');
            }, 2000);
        });

    });

}
//deleteApplication()



function createApplication() {
    casper.then(function() {
        this.echo("==========================================");
        this.echo("CREATE APPLICATION");
        this.echo("==========================================");
    });
    casper.then(function() {
        this.test.assertExists('a[href="applications"]', "My Application tab found");

    });

    casper.thenClick('a[href="applications"]', function() {
        this.echo("Clicked My Application");
    });

    casper.then(function() {

        this.waitForText("My applications", function() {
            this.echo('Inside My application');
            this.echo('New location is: ' + this.getCurrentUrl());
        });
    });


    casper.then(function() {

        this.echo('Adding new application: Auto_' + tStamp);
        this.sendKeys('input[id="applicationName"]', "Auto_" + tStamp, {
            keepFocus: false
        });
        this.thenClick('#addButton', function() {
            this.echo("Clicked add application button");
        });
        this.waitForText(tStamp, function success() {
            this.test.assertTextExist(tStamp, 'Application successfully added');
        }, function fail() {
            this.test.assertTextExist(tStamp, 'Application successfully added');
        }, 10000);


    });
}
//createApplication()

function addAPI() {
        timeBefore = new Date().getTime();
    casper.then(function() {
        this.echo("==========================================");
        this.echo("ADDING API");
        this.echo("==========================================");
    });
    casper.waitForSelector('#editAPILink', function() {
        this.echo('Found Edit API tab');
        this.thenClick('#editAPILink', function() {
            this.echo('Clicked Edit API tab');
            this.echo('New location is: ' + this.getCurrentUrl());
        });
    });

    casper.then(function() {
        this.waitForSelector('input[id="apiName"]', function success() {
            this.test.assertExists('input[id="apiName"]', 'Add API page opened');
            this.echo('Adding API name');
            this.sendKeys('input[id="apiName"]', "Auto_API", {
                keepFocus: false
            });
            this.echo('Adding API context');
            this.sendKeys('input[id="apiContext"]', "/cars_auto", {
                keepFocus: false
            });
            this.echo('Adding API version');
            this.sendKeys('input[id="apiVersion"]', "1.0", {
                keepFocus: false
            });
            this.echo('Adding API resource');
            this.thenClick('a[id="add_row"]', function() {
                if (this.visible('input[id="resourceTemplate-0"]')) {
                    this.echo("Resource field visible");
                    this.sendKeys('input[id="resourceTemplate-0"]', "/carlist.json", {
                        keepFocus: false
                    });
                    this.evaluate(function(){
                        var desiredValue = "Unlimited";
                        var el = document.querySelector('select#tiers-0');
                        for(var i=0; i<el.options.length; i++) {
                          if ( el.options[i].text == desiredValue ) {
                            el.selectedIndex = i;
                            $('#tiers-0').trigger('change');
                            break;
                          }
                        }
                    });
                } else {
                    this.echo("Resource field NOT visible");
                }
            });

        }, function fail() {
            this.echo('Add API page not found');
        }, 10000);
    });

    casper.then(function() {
        this.echo('Selecting Tier Availability');
        this.click('span[class="caret"]');
        this.waitForSelector('div[class="checkBoxContainer"]', function found() {
            var x = this.evaluate(function() {
                return document.querySelectorAll('div[class="multiSelectItem ng-scope vertical"]').length;
            });
            if (x == 4) {
                this.test.pass('Tier list shown');
                this.evaluate(function() {
                    var element = document.querySelectorAll('button.helperButton.ng-binding.ng-scope')[0];
                    element.click();
                });
            } else
                this.test.fail('Tier list shown but number of options is not 5. The value is: ' + x);
        }, function notfound() {
            this.echo('Tier button not shown');
        }, 5000);
    });
    casper.then(function() {
        var y = this.evaluate(function() {
            return document.querySelector('button[ng-bind-html="varButtonLabel"]').innerText;
        });
        this.echo(y);

    });
    casper.then(function() {
        this.echo('Adding API UAT endpoint');
        this.fillSelectors('form[id="editAPIForm"]', {
            'input[id="uatEndpointURL"]': 'http://lxsrvmgi1900.mgi.de:8080/AngularSpringApp/cars'
        }, true);

        this.echo('Adding API production endpoint');
        this.fillSelectors('form[id="editAPIForm"]', {
            'input[id="prodEndpointURL"]': 'http://lxsrvmgi1900.mgi.de:8080/AngularSpringApp/cars'
        }, true);
       
       
    });
    casper.thenClick('input[id="saveButton"]', function() {
        this.echo('Saving API');
        this.waitForText("Go to", function success() {
            this.echo('The API was successfully saved!');
            this.test.assertTextExist('Success', 'The API was successfully saved!');

            var text = this.evaluate(function() {
                return document.getElementsByClassName('bootbox-body')[0].innerText;
            });
            this.echo(text);
        }, function fail() {
            this.echo('The API was not saved. Timeout occured');
            this.test.assertTextExist('Success', 'The API was successfully saved!');
        }, 15000);

    });
    casper.then(function() {

        this.waitForSelector(x('html/body/div[2]/div[2]/div/div[3]/button'), function success() {
            this.echo('Go to API list button visible');
            timeAfter = new Date().getTime();
            howMuchTime = timeAfter - timeBefore;
            fs.write("time.txt", new Date().toISOString() + '|' + addAPI.name + '|' + howMuchTime + '\n', 'a');
        }, function fail() {
            this.echo('Go to API list button NOT visible when timeout reached');
        }, 10000);

        this.thenClick(x('html/body/div[2]/div[2]/div/div[3]/button'), function() {
            this.echo("Go to API list button clicked");
        });

    });
    
    casper.then(function() {
        this.echo("WAITING 50 SECONDS FOR API SYNC");
        this.wait(50000);
    });
     casper.then(function(){
        this.echo("==========================================");
        this.echo("VERIFY API CREATION");
        this.echo("==========================================");
     });

    filterAPI();

}
//addAPI

function filterAPI(flag) {
    casper.then(function() {
        this.echo("=====================");
        this.echo("FILTER API");
        this.echo("=====================");
    });
    casper.then(function() {
        this.echo('Searching the Auto API');
        this.sendKeys('input[name="query"]', "Auto_", {
            keepFocus: false
        });
        this.thenClick('button.btn.btn-primary', function() {
            this.echo("Search button pressed");
            this.waitForText("Auto_API", function found() {
                this.echo('API search returned');
                this.test.assertTextExist('Auto_API', 'API was searched and found via filtering mechanism');
            }, function notfound() {
                this.echo('API search did not return');
                if (flag == '')
                    this.test.assertTextExist('Auto_API', 'API was searched and found via filtering mechanism');
            }, 5000);
        });

    });
}
//filterAPI


function deleteApi() {
    casper.then(function() {
        this.echo("==========================================");
        this.echo("DELETE API");
        this.echo("==========================================");
    });
    casper.thenClick('a[href="browse"]', function() {
        this.echo("Clicked Browse API");
    });

    filterAPI();
    //    var apiNo = verifyFilterAPI();

    casper.then(function() {

        this.thenClick(x('//*[@id="page-wrapper"]/div/div/div[3]/div/div/div[2]/a[4]/span/i'), function() {
            this.echo("Delete API button pressed");
            this.waitForText("Confirm deletion", function success() {
                this.echo('Confirm API deletation modal dialog appears');
                this.click(x('html/body/div[2]/div[2]/div/div[3]/button[1]'));
                this.waitWhileVisible(x('html/body/div[2]/div[2]/div/div[3]/button[1]'), function done() {
                    this.echo('Delete confirmation dissapeared');
                }, function notdone() {
                    this.echo('Delete confirmation did not dissapear when timeout');
                }, 5000);
            }, function fail() {
                this.echo('Confirm API deletation modal dialog did not appear and timeout reached');
            }, 15000);

        });

    });

    filterAPI(1);
    casper.waitForText('Auto_API', function found() {
        this.test.fail('API not deleted');
    }, function notfound() {
        this.test.pass('API successfully deleted');
        this.echo("Waiting 30 seconds after API deletation");
        this.wait(30000);
    }, 3000);
}
//deleteAPI

function changeLifecycle() {
    casper.then(function() {
        this.echo("==========================================");
        this.echo("CHANGE LIFECYCLE");
        this.echo("==========================================");
    });

    casper.then(function() {
        this.waitForSelector('a[href="browse"]', function success() {
            this.echo("Browse API tab is visible");
        }, function fail() {
            this.echo("Browse API tab NOT visible after timeout");
        }, 10000);

    });

    casper.thenClick('a[href="browse"]', function() {
        this.waitForSelector('button[class="btn btn-primary"]',function found(){
            this.echo("Clicked Browse API");
        },function notFound(){
            this.echo("Not inside Browse API");
        },5000);

    });
    filterAPI();
    casper.then(function() {

        this.click('div[title="Auto_API"]');
    });

    casper.waitForText("Lifecycle", function() {
        this.echo('Inside the edit API page');
    }, function() {
        this.echo('We are not in the edit API page');
    }, 15000);

    casper.thenClick(x('//*[@id="page-wrapper"]/div/div/div[2]/div/ul/li[2]/a'), function() {
        this.echo("Lifecycle tab selected");
    });

    casper.waitForText("State:", function() {
        this.echo('Inside the Lifecycle tab');
        casper.echo('Current location is: ' + this.getCurrentUrl());
    }, function() {
        this.echo('We are not in the Lifecycle tab');
    }, 15000);

    casper.thenEvaluate(function() {
        document.querySelector('select[id="apiState"]').selectedIndex = 2;
        $('#apiState').trigger('change');
    });


    casper.then(function() {
        this.click('button[id="updateStatusButton"]');
        this.waitForText("The API status was successfully updated", function() {
            this.echo('Lifecycle changed');
            this.echo(new Date().getTime());
            this.test.assertTextExist('The API status was successfully updated', 'Lifecycle changed');
        }, function() {
            this.echo('Lifecycle not changed');
            this.test.assertTextExist('The API status was successfully updated', 'Lifecycle changed');
        }, 5000);

    });

    casper.then(function() {
        this.echo("WAITING 60 SECONDS FOR API SYNC");
        this.wait(60000);
    });
}
//changeLifecycle


function subscribe2Api() { //with subscriber user
    casper.then(function() {
        this.echo("==========================================");
        this.echo("SUBSCRIBE TO API");
        this.echo("==========================================");
    });
    casper.then(function() {

        this.waitForText('Subscribe to an API', function found() {
            this.echo("Subscribe to an API tab visible");
            this.click('i.fa.fa-fw.fa-magnet');
        }, function notfound() {
            this.echo('Subscribe to an API tab NOT visible when timeout reached');
        }, 5000);

    });


    casper.then(function() {

        this.waitForText("All published", function() {
            this.echo("We are in the subscribe to an api window");
            this.test.assertTextExist("All published", "We are in the subscribe to an api window");
        }, function() {
            this.echo('We are not in the subscribe to an API window');
            this.test.assertTextExist("All published", "We are in the subscribe to an api window");
        }, 5000);

    });
    filterAPI();

    casper.thenClick('div[title="Auto_API"]', function() {

        this.waitForText("Provider", function() {
            this.echo('We can subscribe to the selected API');
            this.evaluate(function() {
                var count = $('#existingApplicationsSelect').children('option').length;
                $('#existingApplicationsSelect').val(count - 1).change();
            });
        }, function() {
            this.echo('We are not in the selected API');
        }, 15000);

    });


    casper.thenClick('input[value="Send subscription request"]', function() {

        this.waitForText("Success", function() {
            this.echo('Success confirmation dialog appears');
            this.test.assertTextExist('Success', 'Subscribed with success');
            this.thenClick(x('/html/body/div[2]/div[2]/div/div[3]/button[1]'), function() {
                this.echo('Go to my subscriptions button pressed');
            });
        }, function() {

            this.echo('We are not in the subscription page');
            this.test.assertTextExist('Success', 'Subscribed with success');
        }, 15000);

    });
}
//subscribe2API

function unSubscribe2Api() {
    casper.then(function() {
        this.echo("==========================================");
        this.echo("UNSUBSCRIBE FROM API");
        this.echo("==========================================");
    });

    casper.waitForSelector('a[href="subscriptions"]').thenClick('a[href="subscriptions"]', function() {
        this.echo("Clicked on My Subscription");
    });

    casper.waitForSelector("#applicationsSelect", function() {
        this.echo("We are in the My Subscriptions page");
        this.echo('Location is: ' + this.getCurrentUrl());
        this.test.assertExists("#applicationsSelect", "We are in the My Subscriptions page");
        this.evaluate(function() {
            var count = $('#applicationsSelect').children('option').length;
            $('#applicationsSelect').val(count - 1);
            $('#applicationsSelect').change();
        });

    }, function() {
        this.echo('We are not in the My Subscriptions page');
        this.test.assertExists("#applicationsSelect", "We are in the My Subscriptions page");
    }, 5000);


    casper.then(function() {

        this.waitForText("Subscribed APIs",
            function() {
                this.echo('We are in the Subscribed API section');
            },
            function() {
                this.echo('Subscribed APIs text not found');
            }, 5000)
    }).thenClick(x('//*[@id="page-wrapper"]/div/div/div[2]/div[3]/div/div/div[2]/div/div/div[2]/a[3]'), function() {
        this.waitForText("Are you sure", function() {
            this.echo("Subscription deletation confirmation window appears");
            this.thenClick(x('/html/body/div[2]/div[2]/div/div[3]/button[1]'), function() {
                this.echo('Yes confirmation pressed');
            });
            this.waitForText('There is no', function success() {
                this.test.pass('Unsubscribed successfull');
            }, function fail() {
                this.test.fail('Unsubscribed was not successfull');
            }, 10000);
        }, function() {
            this.echo('Subscription deletation confirmation window does not appear');
        }, 5000);
    });

    casper.then(function(){
            this.echo("Waiting 20 seconds for sync");
            this.wait(20000);
    });


} //unSubscribe2Api

function getToken() {
    casper.then(function() {
        this.echo("==========================================");
        this.echo("GET TOKEN");
        this.echo("==========================================");
    });

    casper.thenClick('a[href="subscriptions"]', function() {
        this.echo("Clicked on My Subscription");
    });

    casper.waitForSelector("#applicationsSelect", function() {
        this.echo("We are in the My Subscriptions page");
        this.echo('Location is: ' + this.getCurrentUrl());

        this.evaluate(function() {
            var count = $('#applicationsSelect').children('option').length;
            $('#applicationsSelect').val(count - 1);
            $('#applicationsSelect').change();
        });

    }, function() {
        this.echo('We are not in the My Subscriptions page');
    }, 5000);

    casper.then(function() {

        this.waitForText("Subscribed APIs",
            function found() {
                this.echo('Selected the Auto application');
            },
            function notfound() {
                this.echo('Did not select the Auto application');
            }, 5000);
    }).thenClick(x('//*[@id="accordion"]/div['+GTW_NO+']/div/div[1]/a'), function() {
        this.waitForText("Consumer key", function found() {
            this.echo("Consumer keys generation appears");
            this.test.assertTextExists("Consumer key", 'Token expanded window shown');
        }, function notfound() {
            this.echo('Subscription deletation confirmation window does not appear');
            this.test.assertTextExists("Consumer key", 'Expanded token  window shown');
        }, 5000);
    });

    casper.then(function() {

        this.echo('Placing validity period');
        this.sendKeys('input[id="'+env_+'ValidityPeriod"]', '9999');
        this.thenClick('input[id="'+env_+'GenerateButton"]', function() {
            this.echo('Generate button pressed');
            this.waitForText("Error",
                function found() {
                    var error = this.evaluate(function() {
                        return document.getElementsByClassName('bootbox-body')[0].innerText;
                    });

                    this.echo(error);
                },
                function notfound() {
                    this.echo('No errors when Generate button pressed');
                    var flag = 0;
                    var code = this.evaluate(function(token) {
                        if (flag == 10) return 0;
                        setTimeout(function() {
                            if (document.getElementById(token).value != "")
                                return document.getElementById(token).value;
                            else
                                flag++;
                            f();

                        }, 1000);

                    },TOKEN_ACCESS);
                }, 5000)
        });
    });

    casper.then(function() {
        new_token = this.evaluate(function(token) {
            return document.getElementById(token).value;
        },TOKEN_ACCESS);
        if (new_token != '') {
            this.echo("New token is : " + new_token);
//            fs.write("token.txt", new_token, 'w');
            this.test.pass('Token generated');

        } else {
            this.test.fail('Token not generated');
        }


    });
} //getToken

function callAPI() {
    casper.then(function() {

        this.echo("==========================================");
        this.echo("CALL API");
        this.echo("==========================================");
        this.echo("Waiting 30 seconds before making a call - just to stay safe");
        this.wait(30000);

        var headers = {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + new_token
            }
        };
       
        this.open(GTW, headers).then(function(response) {
            this.echo(this.result.status);
            this.echo(this.currentHTTPStatus);
            //utils.dump(this.page.content);
            if (this.currentHTTPStatus == '200')
                this.test.pass('call made with success!');
            else
                this.test.fail('call response was not 200');
        });
    })
} //callAPI

function marsLogOut() {
    casper.waitForSelector('a[data-toggle="dropdown"]', function found() {
        this.click('a[data-toggle="dropdown"]');
        this.waitForSelector('a[href="logout"]', function found() {
            this.click('a[href="logout"]');
            this.waitForText('Please Sign In', function found() {
                this.test.pass('Logout with success!!');
            }, function notfound() {
                this.test.fail('Logout failed!!');
            }, 5000);
        }, function notfound() {
            this.echo('Logout option not found in drop-down');
        }, 5000)
    }, function notfound() {
        this.echo('Top - right menu not found!');
    }, 5000);
} //marsLogOut

function pendingSubs() { //only with publisher
    casper.then(function() {
        this.waitForSelector('span#pendingSubsSpan', function found() {
            this.test.pass("Pending subscription menu found");
            this.click('span#pendingSubsSpan');
            this.waitForText('Action', function found() {
                  this.evaluate(function(){
                    var desiredValue = "Unlimited";
                        var el = document.querySelector('select.form-control.ng-pristine.ng-valid');
                        for(var i=0; i<el.options.length; i++) {
                          if ( el.options[i].text == desiredValue ) {
                            el.selectedIndex = i;
                            $('.form-control.ng-pristine.ng-valid').trigger('change');
                            break;
                          }
                        }
                });
             
            }, function notfound() {
                this.echo('Not in Pending Subscriptions');
            }, 5000).thenClick('i.fa.fa-thumbs-o-up');

            this.waitForText('No pending subscriptions', function found() {
                    this.test.pass('Subscription approved');
                }, function notfound() {
                    this.test.fail('Subscription not approved');
                }, 5000);
        }, function notfound() {
            this.echo('Pending Subscription menu not shown');
                this.test.fail('Pending Subscription menu not shown');
        }, 5000);
    });

} //pendingSubs

function createNewVersion() {
      casper.then(function() {
        this.echo("==========================================");
        this.echo("COPY AND MAKE COPY DEFAULT VERSION");
        this.echo("==========================================");
    });
        casper.thenClick('a[href="#overview"]', function(){
            this.waitForText('Copy API',function found(){
            this.click('button#copyAPIButton');
            this.waitForText('New version',function found() {
                        this.sendKeys('input#newVersion', '2.1.1.3');
                           this.echo("Entered new version 2.1.1.3 of the Auto_API")
                        this.click('input#defaultVersionCheckbox');
                            this.echo("Made the new version default");
                        this.click('button#executeAPICopyingBtn');

                        this.waitForText("Success",function found(){
                                this.click('button.btn.btn-success');
                                this.waitForText("2.1.1.3", function found() {
                                this.test.pass("A newer version of the API was published");
                                    this.echo("Waiting 50 seconds for API to be copied");
                                    this.wait(50000);
                                    }, function notfound() {
                                       this.test.fail("A newer version of the API can't be seen")
                                    }, 5000);
                        },function notfound(){
                                this.test.fail('Label Go to APIs List not found. Copy API did not take place');
                        },5000);
                    },function notfound(){
                            this.test.fail('Copy API was not clicked');
                    },5000);
                                                 
                }, function notfound(){
            this.echo('Not inside Overview tab');
        },5000);
    });
        
}

function deleteApiandVersion() {
    casper.then(function() {
        this.echo("==========================================");
        this.echo("DELETE API AND APIs newer version");
        this.echo("==========================================");
    });
    casper.thenClick('a[href="browse"]', function() {
        this.echo("Clicked Browse API");
    });
    filterAPI();
    casper.then(function() {
         this.thenClick(x('//*[@id="page-wrapper"]/div/div/div[3]/div[1]/div/div[2]/a[4]/span/i'), function() {
            this.echo("Delete API button pressed");
            this.waitForText("Confirm deletion", function success() {
                this.echo('Confirm API deletation modal dialog appears');
                this.click(x('html/body/div[2]/div[2]/div/div[3]/button[1]'));
                this.waitWhileVisible(x('html/body/div[2]/div[2]/div/div[3]/button[1]'), function done() {
                    this.echo('Delete confirmation dissapeared');
                }, function notdone() {
                    this.echo('Delete confirmation did not dissapear when timeout');
                }, 5000);
            }, function fail() {
                this.echo('Confirm API deletation modal dialog did not appear and timeout reached');
            }, 15000);
        });
    });

    filterAPI(1);
    casper.waitForText('Auto_API', function found() {
        this.test.fail('API not deleted');
    }, function notfound() {
        this.test.pass('API successfully deleted');
        this.echo("Waiting 30 seconds after API deletation");
        this.wait(30000);
    }, 3000);
}
//deleteApiandVersion

function ShowMyAPIs() {
    casper.then(function() {
        this.echo("==========================================");
        this.echo("SHOW MY APIs");
        this.echo("==========================================");
    });
    casper.then( function() {
        this.waitForSelector('span[ng-model="showMyAPIs"]', function sucess() {
            this.echo('The Show my APIs button is visible');        
        }, function fail() {
            this.echo('The "Show my APIs" button is not visible');
        });
        this.thenClick('span[ng-model="showMyAPIs"]', function() {
            this.echo('Clicked "Show my APIs button"') });
        this.waitForText("Auto_API", function sucess(){
            this.echo("Clicking the button shows my newly added API")
            }, function fail() {
                this.echo("Clicking the button isn't showing my newly added API")
            });
    });
}



casper.test.begin('Regression Test', 37, function(test) {
    marsLogIn("publisher");
    addAPI();
    // ShowMyAPIs();
    // changeLifecycle();
    // marsLogOut();
    // casper.wait(50000);
    // marsLogIn("subscriber");
    // createApplication();
    // subscribe2Api();
    // marsLogOut();
    // marsLogIn("publisher");
    // pendingSubs();
    // marsLogOut();
    // marsLogIn("subscriber");
    // getToken();
    // callAPI();
    // casper.back();
    // unSubscribe2Api()
    // deleteApplication();
    // marsLogOut();
    // marsLogIn("publisher");
    // deleteApiandVersion(); 


});
casper.run(function() {
    this.test.done();
});


//casperjs test sample.js --env=1 --proxy=proxy.mgi.de:3128 --ssl-protocol=any --xunit=log.xml