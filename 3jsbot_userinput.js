//////////////////////////////////////////////////
/////     USER INTERACTION SUPPORT ROUTINES
//////////////////////////////////////////////////

/* CS148 user input control mappings (based on reference code)
WASD - move robot base in plane forward/left/backward/right
QE - rotate robot base in plane left/right
HJKL - move joint selector left sibling/parent/child/right sibling
UI - rotate selected joint positive/negative
O - enable PD servo (while held down)
P - enable IK (while held down)
RF - move IK target position up/down
*/

/* CS148: user input for selecting joints */
function init_keyboard_events() {
    console.log("Keyboard Event Listener Added");
    document.addEventListener('keydown', function(e) {handle_keydown(e.keyCode); }, true);
}

function handle_keydown(keycode) {
    console.log("handle_keydown: "+keycode);
    switch (keycode) { // h:72 j:74 k:75 l:76
    case 74: // j 
        change_active_link_down();
        console.log("change_active_link_down");
        break;
    case 75: // k
        change_active_link_up();
        console.log("change_active_link_up");
        break;
    case 76: // l
        change_active_joint_next();
        console.log("change_active_joint_next");
        break;
    case 72: // h
        change_active_joint_previous();
        console.log("change_active_joint_previous");
        break;
    }
}

function user_input() {
    
    // traverse generated motion plan
    if ( keyboard.pressed("n") |  keyboard.pressed("b")) {
        if (typeof robot_path !== 'undefined') {

            // increment index
            if ((keyboard.pressed("n"))&&(robot_path_traverse_idx < robot_path.length-1))
                robot_path_traverse_idx++;

            if ((keyboard.pressed("b"))&&(robot_path_traverse_idx > 0))
                robot_path_traverse_idx--;

             // set angle
            robot.origin.xyz = [
                robot_path[robot_path_traverse_idx].vertex[0],
                robot_path[robot_path_traverse_idx].vertex[1],
                robot_path[robot_path_traverse_idx].vertex[2]
            ];

            robot.origin.rpy = [
                robot_path[robot_path_traverse_idx].vertex[3],
                robot_path[robot_path_traverse_idx].vertex[4],
                robot_path[robot_path_traverse_idx].vertex[5]
            ];

            for (x in robot.joints) {
                //q_names[x] = q_start_config.length;
                robot.joints[x].angle = robot_path[robot_path_traverse_idx].vertex[q_names[x]];
            }
        }
    }
    
    // generate motion plan
    if ( keyboard.pressed("m") )
        generate_motion_plan = true;
    else
        generate_motion_plan = false;

    
    /* CS148: user input for controlling joints */ 
    // incrment/decrement angle of active joint 
    if ( keyboard.pressed("u") ) {
        robot.joints[active_joint].control += 0.01;  // add motion increment 
    }
    else if ( keyboard.pressed("i") ) {
        robot.joints[active_joint].control += -0.01;  // add motion increment 
    }

     //CS148: user input for base movement
    // move robot base in the ground plane
    if ( keyboard.pressed("a") ) {  // turn
        robot.control.rpy[1] += 0.1;
    }
    if ( keyboard.pressed("d") ) {  // turn
        robot.control.rpy[1] += -0.1;
    }

    if ( keyboard.pressed("w") ) {  // forward
        //robot.origin.xyz[2] += 0.1;  // simple but ineffective: not aligned with robot
        robot.control.xyz[2] += 0.1 * (robot_heading[2][0]-robot.origin.xyz[2]);
        robot.control.xyz[0] += 0.1 * (robot_heading[0][0]-robot.origin.xyz[0]);
    }
    if ( keyboard.pressed("s") ) {  // backward
        //robot.origin.xyz[2] -= 0.1; // simple but ineffective: not aligned with robot
        robot.control.xyz[2] += -0.1 * (robot_heading[2][0]-robot.origin.xyz[2]);
        robot.control.xyz[0] += -0.1 * (robot_heading[0][0]-robot.origin.xyz[0]);
    }
    if ( keyboard.pressed("q") ) {  // strafe
        //robot.origin.xyz[0] += 0.1; // simple but ineffective: not aligned with robot

        robot.control.xyz[2] += 0.1 * (robot_lateral[2][0]-robot.origin.xyz[2]);
        robot.control.xyz[0] += 0.1 * (robot_lateral[0][0]-robot.origin.xyz[0]);
    }
    if ( keyboard.pressed("e") ) {  // strafe
        // robot.origin.xyz[0] -= 0.1; // simple but ineffective: not aligned with robot

        robot.control.xyz[2] += -0.1 * (robot_lateral[2][0]-robot.origin.xyz[2]);
        robot.control.xyz[0] += -0.1 * (robot_lateral[0][0]-robot.origin.xyz[0]);
    }

    /* CS148: user input for executing inverse kinematics iterations */
    if ( keyboard.pressed("p") )
        update_ik = true;

    /* CS148: user input for executing proportional derivative servo */
    if ( keyboard.pressed("o") )
        update_pd = true;

    /* CS148: user input for moving IK target up/down */
    if ( keyboard.pressed("r") )   // ik target up
        ik_target[1][0] += 0.01;
    if ( keyboard.pressed("f") )  // ik target down
        ik_target[1][0] -= 0.01;

    /* CS148: user input for moving IK target left/right */
    if ( keyboard.pressed("t") )   // ik target right
        ik_target[0][0] += 0.01;
    if ( keyboard.pressed("g") )  // ik target left
        ik_target[0][0] -= 0.01;

    /* CS148: user input for moving IK target left/right */
    if ( keyboard.pressed("y") )   // ik target right
        ik_target[2][0] += 0.01;
    if ( keyboard.pressed("h") )  // ik target left
        ik_target[2][0] -= 0.01;
}


/* CS148: user input for joint selection */

function change_active_link_down() {
    if (robot.links[robot.joints[active_joint].child].children.length !== 0) {
        robot.joints[active_joint].display_geom.material.opacity = 1.0; 

        active_link = robot.joints[active_joint].child;
        active_joint = robot.links[active_link].children[0];

        robot.joints[active_joint].display_geom.material.opacity = 0.5; 
    }
}

function change_active_link_up() {
    if (active_link !== robot.base) {
        robot.joints[active_joint].display_geom.material.opacity = 1.0; 

        active_joint = robot.links[active_link].parent;
        active_link = robot.joints[active_joint].parent;

        robot.joints[active_joint].display_geom.material.opacity = 0.5; 
    }
}

function change_active_joint_next() {
    robot.joints[active_joint].display_geom.material.opacity = 1.0; 

    active_joint = robot.links[active_link].children[(robot.links[active_link].children.indexOf(active_joint)+1) % robot.links[active_link].children.length];

    robot.joints[active_joint].display_geom.material.opacity = 0.5; 
}

function change_active_joint_previous() {
    robot.joints[active_joint].display_geom.material.opacity = 1.0; 

    active_joint = robot.links[active_link].children[(robot.links[active_link].children.length + robot.links[active_link].children.indexOf(active_joint)-1) % robot.links[active_link].children.length];

    robot.joints[active_joint].display_geom.material.opacity = 0.5; 
}

