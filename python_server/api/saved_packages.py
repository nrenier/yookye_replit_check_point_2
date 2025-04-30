from flask import Blueprint, request, jsonify
from flask_cors import cross_origin # Assuming CORS is handled at the app level, but good to have
from ..utils.auth import login_required # Corrected import for login_required decorator
# from ..models.repositories import SavedPackageRepository # Uncomment and implement your repository
# from ..models.models import SavedPackage # Uncomment and implement your SavedPackage model
# from ..config.settings import INDEX_SAVED_PACKAGES # Uncomment and define this setting
import uuid # Import uuid for generating IDs
import logging # Import logging

logger = logging.getLogger(__name__)

saved_packages_bp = Blueprint('saved_packages', __name__)

# Initialize repository (will need actual implementation)
# Make sure to pass necessary dependencies like your database client
# saved_package_repository = SavedPackageRepository(your_db_client) # Replace your_db_client

@saved_packages_bp.route('/', methods=['POST'])
@cross_origin() # Or handle CORS at app level in app.py
@login_required # Use the correct decorator for authentication
def save_package(current_user):
    """Saves a user-composed package."""
    data = request.json
    if not data:
        logger.warning(f"User {current_user.get('username','N/A')} sent empty data for saving package.")
        return jsonify({'message': 'Invalid input: missing package data'}), 400

    # Add user ID to the package data
    package_to_save = data
    # Ensure userId is a string if your backend expects it. Use .get to avoid KeyError if _id is missing.
    user_id_str = str(current_user.get('_id')) if current_user and current_user.get('_id') else None
    if not user_id_str:
         logger.error("Authenticated user has no _id.")
         return jsonify({'message': 'Authentication error: user ID not found'}), 500
    package_to_save['userId'] = user_id_str

    # Generate a unique ID for the saved package if not already present or if frontend ID is temporary
    # Refine this ID generation logic based on whether you trust frontend IDs or always generate backend IDs
    frontend_id = package_to_save.get('id', '')
    if not frontend_id or frontend_id.startswith('composed-'):
         package_to_save['id'] = str(uuid.uuid4())
    else:
        # If frontend provided an ID, use it (be cautious about potential conflicts or malicious IDs)
        pass # Use the frontend_id


    try:
        # TODO: Implement saving the package_to_save dictionary/object to your data storage
        # Example (assuming a create method in your repository that returns the saved object or ID):
        # saved_package_result = saved_package_repository.create(package_to_save)
        # saved_package_id = saved_package_result.get('id') if isinstance(saved_package_result, dict) else str(saved_package_result)

        # For now, just log and return the package data including the (potentially new) ID
        logger.info(f"Attempting to save package {package_to_save.get('id','no_id')} for user {user_id_str}.")

        # --- REPLACE THE FOLLOWING MOCK RESPONSE WITH ACTUAL DATABASE SAVE --- 
        # Mock success response
        saved_package_id = package_to_save.get('id') # Use the ID that was set/generated
        if not saved_package_id:
             # Fallback if ID generation failed unexpectedly
             saved_package_id = str(uuid.uuid4()) # Generate a fallback ID
             package_to_save['id'] = saved_package_id
             logger.warning(f"Generated fallback ID {saved_package_id} for package.")

        # In a real scenario, you would return data from the database after saving
        return jsonify({'message': 'Package received for saving', 'packageId': saved_package_id, 'savedPackage': package_to_save}), 201
        # ------------------------------------------------------------------

    except Exception as e:
        logger.error(f"Error saving package for user {user_id_str}: {e}", exc_info=True)
        return jsonify({'message': 'Error saving package', 'error': str(e)}), 500

@saved_packages_bp.route('/', methods=['GET']) # Corrected route
@cross_origin() # Or handle CORS at app level in app.py
@login_required # Use the correct decorator for authentication
def get_saved_packages(current_user):
    """Retrieves all saved packages for the authenticated user."""
    user_id = str(current_user.get('_id')) if current_user and current_user.get('_id') else None
    if not user_id:
         logger.error("Authenticated user has no _id during get saved packages.")
         return jsonify({'message': 'Authentication error: user ID not found'}), 500

    try:
        # TODO: Implement fetching saved packages from your data storage by user ID
        # Example (assuming a find_by_user method in your repository that returns a list of package dictionaries/objects):
        # saved_packages_list = saved_package_repository.find_by_user(user_id)

        # For now, return mock data or an empty list
        logger.info(f"Attempting to fetch saved packages for user {user_id}.")

        # --- REPLACE THE FOLLOWING MOCK RESPONSE WITH ACTUAL DATABASE FETCH --- 
        mock_packages = [
            # Example mock saved package (should match TravelPackage schema and include userId)
            # Make sure these have a valid 'id' field.
            # {
            #     "id": "mock-saved-1",
            #     "userId": user_id,
            #     "title": "Mock Saved Trip to Rome",
            #     "description": "A test saved package.",
            #     "destination": "Rome",
            #     "imageUrl": "",
            #     "rating": "5",
            #     "reviewCount": 10,
            #     "accommodationName": "Mock Hotel",
            #     "accommodationType": "Hotel",
            #     "transportType": "",
            #     "durationDays": 3,
            #     "durationNights": 2,
            #     "experiences": ["Mock Experience 1", "Mock Experience 2"],
            #     "price": 500,
            #     "isRecommended": False,
            #     "categories": ["test"],
            #     "savedAt": "2023-10-27T10:00:00Z" # Example of an extra field for saved packages
            # }
        ]
        return jsonify(mock_packages), 200 # Return the fetched list
        # ---------------------------------------------------------------------

    except Exception as e):
        logger.error(f"Error fetching saved packages for user {user_id}: {e}", exc_info=True)
        return jsonify({'message': 'Error fetching saved packages', 'error': str(e)}), 500

@saved_packages_bp.route('/<package_id>', methods=['DELETE']) # Corrected route
@cross_origin() # Or handle CORS at app level in app.py
@login_required # Use the correct decorator for authentication
def delete_saved_package(current_user, package_id):
    """Deletes a specific saved package for the authenticated user."""
    user_id = str(current_user.get('_id')) if current_user and current_user.get('_id') else None
    if not user_id:
         logger.error(f"Authenticated user has no _id during delete saved package {package_id}.")
         return jsonify({'message': 'Authentication error: user ID not found'}), 500

    try:
        # TODO: Implement deleting saved package from your data storage by package ID and user ID
        # Ensure the package belongs to the current user before deleting
        # Example (assuming a delete method in your repository that returns True on success, False otherwise):
        # success = saved_package_repository.delete(package_id, user_id)

        # --- REPLACE THE FOLLOWING MOCK DELETION LOGIC WITH ACTUAL DATABASE DELETE --- 
        # Mock deletion logic
        logger.info(f"Attempting to delete package {package_id} for user {user_id}. Mocking success.")
        success = True # Assume deletion is successful for now
        # ---------------------------------------------------------------------------

        if success:
            logger.info(f"Package {package_id} deleted successfully for user {user_id}. (Mock)")
            return jsonify({'message': 'Package deleted successfully'}), 200
        else:
            # If package not found for this user or deletion failed for another reason
            logger.warning(f"Failed to delete package {package_id} for user {user_id}: Package not found or not authorized. (Mock)")
            return jsonify({'message': 'Package not found or not authorized'}), 404
    except Exception as e):
        logger.error(f"Error deleting saved package {package_id} for user {user_id}: {e}", exc_info=True)
        return jsonify({'message': 'Error deleting saved package', 'error': str(e)}), 500
