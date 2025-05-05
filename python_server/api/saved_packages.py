from flask import Blueprint, jsonify, request, session
from ..models.repositories import SavedPackageRepository, TravelPackageRepository
from ..models.models import SavedPackage
from ..middleware import verify_token, log_request
import logging

saved_packages_bp = Blueprint("saved_packages", __name__)
saved_repo = SavedPackageRepository()
travel_repo = TravelPackageRepository() 

logger = logging.getLogger(__name__)

@saved_packages_bp.route("", methods=["GET"])
@verify_token
@log_request()
def get_saved_packages():
    """Get all saved packages for the current user"""
    try:
        # Get user ID from session
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"success": False, "message": "User not authenticated"}), 401

        # Get saved packages
        saved_packages = saved_repo.get_by_user_id(user_id)

        # Return packages
        return jsonify({"success": True, "data": saved_packages}), 200
    except Exception as e:
        logger.error(f"Error getting saved packages: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@saved_packages_bp.route("", methods=["POST"])
@verify_token
@log_request()
def save_package():
    """Save a package for the current user"""
    try:
        # Get user ID from session
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"success": False, "message": "User not authenticated"}), 401

        # Get package data from request
        package_data = request.json
        if not package_data:
            return jsonify({"success": False, "message": "No package data provided"}), 400

        # Add user_id to package data
        package_data["userId"] = user_id

        # Create saved package
        saved_package = SavedPackage(**package_data)

        # Save package
        result = saved_repo.create(saved_package)

        # Return result
        return jsonify({"success": True, "data": result}), 201
    except Exception as e:
        logger.error(f"Error saving package: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@saved_packages_bp.route("/my-packages", methods=["GET"])
@verify_token
@log_request()
def get_my_packages():
    """Get all saved packages for the current user (endpoint per 'I miei pacchetti')"""
    try:
        # Get user ID from session
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"success": False, "message": "User not authenticated"}), 401

        # Get saved packages
        saved_packages = saved_repo.get_by_user_id(user_id)

        # Return packages
        return jsonify({"success": True, "data": saved_packages}), 200
    except Exception as e:
        logger.error(f"Error getting saved packages: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

@saved_packages_bp.route("/itinerary", methods=["GET"])
@verify_token
@log_request()
def get_detailed_itinerary():
    """Get detailed itinerary with accommodations and experiences"""
    try:
        # Get user ID from session
        user_id = session.get("user_id")
        if not user_id:
            return jsonify({"success": False, "message": "User not authenticated"}), 401

        # Get job_id from query params
        job_id = request.args.get("job_id")
        if not job_id:
            return jsonify({"success": False, "message": "Job ID is required"}), 400

        # Get itinerary data from the recommendations endpoint
        from ..utils.travel_api_client import get_recommendations_from_api
        from ..models.repositories import PreferenceRepository

        pref_repo = PreferenceRepository()
        preferences = pref_repo.get_by_user_id(user_id)

        if not preferences or len(preferences) == 0:
            return jsonify({"success": False, "message": "Nessuna preferenza trovata"}), 404

        # Usa la preferenza più recente
        latest_preference = preferences[-1]

        # Get the detailed itinerary
        itinerary = get_recommendations_from_api(latest_preference, job_id=job_id, itinerary=True)

        if not itinerary or "status" in itinerary and itinerary["status"] != "COMPLETED":
            return jsonify({
                "job_id": itinerary.get("job_id"),
                "status": itinerary.get("status", "PROCESSING"),
                "message": itinerary.get("message", "Elaborazione in corso"),
            }), 200

        # Return the detailed itinerary
        return jsonify({
            "success": True,
            "data": {
                "destinations": itinerary.get("destinations", []),
                "accommodations": itinerary.get("accommodations", []),
                "experiences": itinerary.get("experiences", [])
            }
        }), 200
    except Exception as e:
        logger.error(f"Error getting detailed itinerary: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500